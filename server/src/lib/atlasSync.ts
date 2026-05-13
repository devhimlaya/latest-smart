/**
 * atlasSync.ts
 *
 * Syncs teaching loads from ATLAS into SMART's DB.
 * Called on server start and on a schedule (every 30 min by default).
 * Also callable via POST /api/admin/sync-atlas for manual trigger.
 *
 * What it syncs:
 *  - ClassAssignments (teacher → subject → section) from ATLAS faculty-assignments
 *
 * What it does NOT sync (separate concern):
 *  - Students/Enrollments from EnrollPro (enrollment opens June 1)
 */
import http from 'http';
import https from 'https';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

const ATLAS_BASE = 'http://100.88.55.125:5001/api/v1';
const ENROLLPRO_BASE = 'https://dev-jegs.buru-degree.ts.net/api';
const ATLAS_SCHOOL_ID = 1;      // ATLAS internal schoolId (EnrollPro uses schoolId=5 but ATLAS stores as 1)
const SCHOOL_YEAR_ID = 8;       // EnrollPro/ATLAS schoolYearId for 2026-2027
const SCHOOL_YEAR = '2026-2027';

// -- State ------------------------------------------------------------------
let syncRunning = false;
let lastSyncAt: Date | null = null;
let lastSyncResult: {
  matched: number; created: number; deleted: number;
  teachersWithLoads: number; errors: string[];
} | null = null;

// -- HTTP helpers -----------------------------------------------------------
function get(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    (lib as any).get(url, { headers }, (res: any) => {
      let body = '';
      res.on('data', (c: any) => body += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} ${url}: ${body.substring(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(`JSON parse error from ${url}`)); }
      });
    }).on('error', reject)
      .setTimeout(20000, function (this: any) { this.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function post(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = (lib as any).request({
      hostname: u.hostname,
      port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res: any) => {
      let r = '';
      res.on('data', (c: any) => r += c);
      res.on('end', () => {
        try { resolve(JSON.parse(r)); }
        catch { reject(new Error(`JSON parse error`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('POST timeout')); });
    req.write(data);
    req.end();
  });
}

// -- Cleanup: remove stale MATH assignments for Homeroom Guidance sections --
// For every (teacher, section) pair where ATLAS assigned HG (Homeroom Guidance),
// delete any MATH assignments that should not be there. Called automatically
// after each atlas sync so Admins and Registrars see clean data immediately.
// Also exported so the admin route can trigger an immediate one-shot cleanup.
export async function cleanupHomeroomMathConflicts(schoolYear: string = SCHOOL_YEAR): Promise<number> {
  const hgSubjects = await prisma.subject.findMany({
    where: { code: { startsWith: 'HG' } },
    select: { id: true },
  });
  if (hgSubjects.length === 0) return 0;
  const hgIds = hgSubjects.map((s) => s.id);

  // Find every (teacher, section) pair that has a Homeroom Guidance assignment.
  const hgAssignments = await prisma.classAssignment.findMany({
    where: { subjectId: { in: hgIds }, schoolYear },
    select: { teacherId: true, sectionId: true },
  });
  if (hgAssignments.length === 0) return 0;

  const mathSubjects = await prisma.subject.findMany({
    where: { code: { startsWith: 'MATH' } },
    select: { id: true },
  });
  if (mathSubjects.length === 0) return 0;
  const mathIds = mathSubjects.map((s) => s.id);

  // Deduplicate pairs to avoid redundant deletes.
  const seen = new Set<string>();
  let total = 0;
  for (const { teacherId, sectionId } of hgAssignments) {
    const key = `${teacherId}|${sectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const removed = await prisma.classAssignment.deleteMany({
      where: { teacherId, sectionId, schoolYear, subjectId: { in: mathIds } },
    });
    total += removed.count;
  }
  return total;
}

// -- Core sync logic --------------------------------------------------------
export async function runAtlasSync(): Promise<typeof lastSyncResult> {
  if (syncRunning) {
    console.log('[AtlasSync] Already running, skipping.');
    return lastSyncResult;
  }

  syncRunning = true;
  const errors: string[] = [];
  let matched = 0, created = 0, deleted = 0, teachersWithLoads = 0;

  try {
    const atlasToken = process.env.ATLAS_SYSTEM_TOKEN;
    if (!atlasToken) {
      throw new Error('ATLAS_SYSTEM_TOKEN not set in environment');
    }
    const authHeader = { Authorization: `Bearer ${atlasToken}` };

    // 1. Get all faculty from ATLAS
    const facultyData = await get(`${ATLAS_BASE}/faculty?schoolId=${ATLAS_SCHOOL_ID}`, authHeader);
    const atlasFaculty: any[] = facultyData.faculty ?? [];

    // 2. Build email → SMART teacher ID map (case-insensitive)
    const emailToTeacherId = new Map<string, string>();
    const allTeachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: { teacher: { select: { id: true } } },
    });
    for (const u of allTeachers) {
      if (u.teacher?.id && u.email) emailToTeacherId.set(u.email.toLowerCase(), u.teacher.id);
    }

    // Match ATLAS faculty by email (case-insensitive)
    const atlasIdToSmartTeacherId = new Map<number, string>();
    for (const af of atlasFaculty) {
      const email = (af.contactInfo ?? '').toLowerCase();
      const tid = emailToTeacherId.get(email);
      if (tid) { atlasIdToSmartTeacherId.set(af.id, tid); matched++; }
    }

    // 3. Build section name → SMART section ID map
    const allSections = await prisma.section.findMany({ where: { schoolYear: SCHOOL_YEAR } });
    const sectionByName = new Map(allSections.map(s => [s.name, s]));

    // 4. Build subject code → SMART subject map
    const allSubjects = await prisma.subject.findMany();
    const subjectByCode = new Map(allSubjects.map(s => [s.code, s]));

    // 5. Fetch teaching loads from ATLAS per faculty
    const loads: Array<{ smartTeacherId: string; subjectCode: string; sectionName: string }> = [];

    for (const af of atlasFaculty) {
      try {
        const detail = await get(
          `${ATLAS_BASE}/faculty-assignments/${af.id}?schoolYearId=${SCHOOL_YEAR_ID}`,
          authHeader,
        );
        const assignments: any[] = detail.assignments ?? [];
        if (assignments.length === 0) continue;

        const smartTeacherId = atlasIdToSmartTeacherId.get(af.id);
        if (!smartTeacherId) continue;

        teachersWithLoads++;
        for (const a of assignments) {
          const subjectCode: string = a.subject?.code ?? '';
          const sections: any[] = a.sections ?? [];
          for (const sec of sections) {
            loads.push({ smartTeacherId, subjectCode, sectionName: sec.name });
          }
        }
      } catch (err: any) {
        errors.push(`Faculty ${af.firstName} ${af.lastName}: ${err.message}`);
      }
    }

    // 6. Delete assignments only for teachers that have Atlas data, then recreate
    //    This preserves manually-created or teacherSync-created assignments for
    //    teachers not yet configured in Atlas.
    const teacherIdsWithAtlasData = [...new Set(loads.map((l) => l.smartTeacherId))];

    if (teacherIdsWithAtlasData.length > 0) {
      const del = await prisma.classAssignment.deleteMany({
        where: { schoolYear: SCHOOL_YEAR, teacherId: { in: teacherIdsWithAtlasData } },
      });
      deleted = del.count;
    }

    const warnedSubjects = new Set<string>();
    for (const load of loads) {
      const section = sectionByName.get(load.sectionName);
      if (!section) continue;

      // Try exact subject code first, then append grade level suffix (e.g. "FIL" → "FIL7")
      let subject = subjectByCode.get(load.subjectCode);
      if (!subject) {
        const gradeSuffix = section.gradeLevel.replace('GRADE_', '');
        subject = subjectByCode.get(load.subjectCode + gradeSuffix);
      }
      if (!subject) {
        const warnKey = `${load.subjectCode}|${section.gradeLevel}`;
        if (!warnedSubjects.has(warnKey)) {
          warnedSubjects.add(warnKey);
          console.warn(
            `[AtlasSync] MISSING SUBJECT MAPPING: Atlas code "${load.subjectCode}" ` +
            `for section "${load.sectionName}" grade=${section.gradeLevel}. ` +
            `Skipping assignment — add this subject to SMART to enable it.`,
          );
        }
        continue;
      }

      try {
        await prisma.classAssignment.upsert({
          where: {
            teacherId_subjectId_sectionId_schoolYear: {
              teacherId: load.smartTeacherId,
              subjectId: subject.id,
              sectionId: section.id,
              schoolYear: SCHOOL_YEAR,
            },
          },
          update: {},
          create: {
            teacherId: load.smartTeacherId,
            subjectId: subject.id,
            sectionId: section.id,
            schoolYear: SCHOOL_YEAR,
          },
        });
        created++;
      } catch { /* duplicate or constraint */ }
    }

    if (warnedSubjects.size > 0) {
      console.warn(
        `[AtlasSync] ${warnedSubjects.size} MISSING SUBJECT MAPPING(S) — ` +
        `unresolved Atlas code(s): ${[...warnedSubjects].map(k => k.split('|')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}. ` +
        `Add these subjects to SMART for full ATLAS alignment.`,
      );
    }

    // 7. Sync section advisers from ATLAS /faculty/advisers
    try {
      const advisersData = await get(`${ATLAS_BASE}/faculty/advisers?schoolId=${ATLAS_SCHOOL_ID}&schoolYearId=${SCHOOL_YEAR_ID}`, authHeader);
      const atlasAdvisers: any[] = advisersData.advisers ?? [];
      const facultyEmailById = new Map<number, string>(atlasFaculty.map(f => [f.id, (f.contactInfo ?? '').toLowerCase()]));
      const emailToTeacherIdForAdviser = new Map<string, string>();
      const teacherUsers = await prisma.user.findMany({ where: { role: 'TEACHER' }, include: { teacher: { select: { id: true } } } });
      for (const u of teacherUsers) {
        if (u.teacher?.id && u.email) emailToTeacherIdForAdviser.set(u.email.toLowerCase(), u.teacher.id);
      }
      const sectionsByName = new Map(allSections.map(s => [s.name, s]));
      for (const adviser of atlasAdvisers) {
        const email = facultyEmailById.get(adviser.id) ?? '';
        const sectionName = adviser.advisedSectionName ?? '';
        const tid = emailToTeacherIdForAdviser.get(email);
        const sec = sectionsByName.get(sectionName);
        if (tid && sec && sec.adviserId !== tid) {
          await prisma.section.update({ where: { id: sec.id }, data: { adviserId: tid } });
        }
      }
      console.log(`[AtlasSync] Advisers synced: ${atlasAdvisers.length} from ATLAS`);
    } catch (advErr: any) {
      console.warn('[AtlasSync] Adviser sync failed:', advErr.message);
    }

    // Global cleanup: remove stale MATH assignments from Homeroom Guidance sections
    // so Admins and Registrars see correct data immediately after sync.
    const cleanedUp = await cleanupHomeroomMathConflicts(SCHOOL_YEAR);
    if (cleanedUp > 0) {
      console.log(`[AtlasSync] Cleaned up ${cleanedUp} stale MATH→Homeroom Guidance conflict(s).`);
    }

    lastSyncResult = { matched, created, deleted, teachersWithLoads, errors };
    lastSyncAt = new Date();
    console.log(`[AtlasSync] ✔ Done: matched=${matched}, created=${created}, deleted=${deleted}, teachers=${teachersWithLoads}, errors=${errors.length}`);
  } catch (err: any) {
    console.error('[AtlasSync] ✗ Sync failed:', err.message);
    errors.push(err.message);
    lastSyncResult = { matched, created, deleted, teachersWithLoads, errors };
  } finally {
    syncRunning = false;
  }

  return lastSyncResult;
}

export function getSyncStatus() {
  return {
    running: syncRunning,
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    result: lastSyncResult,
  };
}

// -- Scheduler (call once on server boot) -----------------------------------
export function startAtlasSyncScheduler(intervalMinutes = 30) {
  console.log(`[AtlasSync] Scheduler started — syncing every ${intervalMinutes} min.`);

  // Initial sync on boot
  runAtlasSync().catch(err => console.error('[AtlasSync] Boot sync error:', err.message));

  // Recurring sync
  const ms = intervalMinutes * 60 * 1000;
  setInterval(() => {
    runAtlasSync().catch(err => console.error('[AtlasSync] Scheduled sync error:', err.message));
  }, ms);
}
