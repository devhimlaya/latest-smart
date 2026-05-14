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
import { getIntegrationV1Sections } from './enrollproClient';
import { syncAdvisoryWorkloadEntry } from './workload';

const ATLAS_BASE = 'http://100.88.55.125:5001/api/v1';
const ENROLLPRO_BASE = 'https://dev-jegs.buru-degree.ts.net/api';
const ATLAS_SCHOOL_ID = 1;      // ATLAS internal schoolId (EnrollPro uses schoolId=5 but ATLAS stores as 1)
const SCHOOL_YEAR_ID = 8;       // EnrollPro/ATLAS schoolYearId for 2026-2027
const SCHOOL_YEAR = '2026-2027';

function normalizeAtlasSubjectCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}

function extractAssignmentOwnerIds(a: any): number[] {
  const candidates = [
    a?.facultyId,
    a?.teacherId,
    a?.instructorId,
    a?.faculty?.id,
    a?.teacher?.id,
    a?.instructor?.id,
    a?.assignedFacultyId,
    a?.assignedTeacherId,
  ];
  return candidates
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
}

function isAssignmentOwnedByFaculty(a: any, atlasFacultyId: number): boolean {
  const ownerIds = extractAssignmentOwnerIds(a);
  // If payload provides owner IDs, enforce strict ownership.
  if (ownerIds.length > 0) {
    return ownerIds.includes(Number(atlasFacultyId));
  }

  const ownerEmails = [
    a?.facultyEmail,
    a?.teacherEmail,
    a?.instructorEmail,
    a?.faculty?.contactInfo,
    a?.teacher?.contactInfo,
    a?.instructor?.contactInfo,
  ]
    .map((v) => String(v ?? '').trim().toLowerCase())
    .filter(Boolean);
  if (ownerEmails.length > 0) {
    return false;
  }

  // If no owner metadata exists, trust faculty-scoped endpoint but do not infer cross-faculty.
  return true;
}

const HOMEROOM_GUIDANCE_LABEL = 'Homeroom Guidance';
const HOMEROOM_GUIDANCE_MINUTES = 60;

async function ensureHomeroomGuidanceLabel(
  subject: { id: string; code: string; name: string },
  updated: Set<string>,
): Promise<void> {
  if (!subject.code.startsWith('HG')) return;
  if (subject.name === HOMEROOM_GUIDANCE_LABEL) return;
  if (updated.has(subject.id)) return;

  await prisma.subject.update({ where: { id: subject.id }, data: { name: HOMEROOM_GUIDANCE_LABEL } });
  subject.name = HOMEROOM_GUIDANCE_LABEL;
  updated.add(subject.id);
}

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
    const atlasFaculty: any[] = Array.isArray(facultyData?.faculty) ? facultyData.faculty : [];
    if (atlasFaculty.length === 0) {
      throw new Error('ATLAS payload verification failed: empty faculty list');
    }

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

    // 3.1 Build EnrollPro sectionId → section details map for ATLAS assignments
    let epSectionById = new Map<number, any>();
    try {
      const epSections = await getIntegrationV1Sections(SCHOOL_YEAR_ID);
      if (!Array.isArray(epSections) || epSections.length === 0) {
        throw new Error('empty sections payload');
      }
      epSectionById = new Map<number, any>(epSections.map((s: any) => [Number(s.id), s]));
    } catch (err: any) {
      throw new Error(`EnrollPro sections lookup failed: ${err.message}`);
    }

    // 4. Build subject code → SMART subject map
    const allSubjects = await prisma.subject.findMany();
    const subjectByCode = new Map(allSubjects.map(s => [s.code, s]));
    const homeroomLabelUpdated = new Set<string>();

    // 5. Fetch teaching loads from ATLAS per faculty
    const loads: Array<{ smartTeacherId: string; subjectCode: string; sectionName: string }> = [];

    let matchedFacultyFetchFailures = 0;
    let matchedFacultyFetchSuccesses = 0;

    for (const af of atlasFaculty) {
      try {
        const smartTeacherId = atlasIdToSmartTeacherId.get(af.id);
        if (!smartTeacherId) continue;

        const detail = await get(
          `${ATLAS_BASE}/faculty-assignments/${af.id}?schoolYearId=${SCHOOL_YEAR_ID}`,
          authHeader,
        );
        const assignmentsPayload = detail?.assignments ?? detail?.data ?? detail ?? [];
        if (!Array.isArray(assignmentsPayload)) {
          matchedFacultyFetchFailures++;
          errors.push(`Faculty ${af.id}: invalid assignments payload shape`);
          continue;
        }

        const assignments: any[] = Array.isArray(assignmentsPayload) ? assignmentsPayload : [];
        matchedFacultyFetchSuccesses++;
        if (assignments.length === 0) continue;

        const ownedAssignments = assignments.filter((a) => a && isAssignmentOwnedByFaculty(a, af.id));
        const flatAssignments = ownedAssignments.filter((a) => a && (a.subjectCode || a.sectionId));
        const nestedAssignments = ownedAssignments.filter((a) => a && (a.subject?.code || a.sections));

        const teacherLoads: Array<{ smartTeacherId: string; subjectCode: string; sectionName: string }> = [];
        if (flatAssignments.length > 0) {
          for (const a of flatAssignments) {
            const subjectCode = normalizeAtlasSubjectCode(a?.subjectCode ?? a?.subject?.code);
            if (!subjectCode) continue;
            const sectionId = Number(a?.sectionId ?? a?.section?.id);
            if (!Number.isFinite(sectionId)) continue;
            const epSection = epSectionById.get(sectionId);
            if (!epSection?.name) {
              errors.push(`ATLAS sectionId=${sectionId} not found in EnrollPro sections`);
              continue;
            }
            teacherLoads.push({ smartTeacherId, subjectCode, sectionName: epSection.name });
          }
        } else if (nestedAssignments.length > 0) {
          for (const a of nestedAssignments) {
            const subjectCode = normalizeAtlasSubjectCode(a.subject?.code ?? '');
            if (!subjectCode) continue;
            const sections: any[] = a.sections ?? [];
            for (const sec of sections) {
              if (!sec?.name) continue;
              teacherLoads.push({ smartTeacherId, subjectCode, sectionName: sec.name });
            }
          }
        }

        if (teacherLoads.length === 0) continue;
        teachersWithLoads++;
        loads.push(...teacherLoads);
      } catch (err: any) {
        if (atlasIdToSmartTeacherId.has(af.id)) {
          matchedFacultyFetchFailures++;
        }
        errors.push(`Faculty ${af.firstName} ${af.lastName}: ${err.message}`);
      }
    }

    // Emergency brake: if any matched teacher payload failed, abort to preserve current data.
    if (matchedFacultyFetchFailures > 0) {
      throw new Error(
        `ATLAS payload verification failed: ${matchedFacultyFetchFailures} matched faculty assignment fetch(es) failed`,
      );
    }

    if (matchedFacultyFetchSuccesses === 0) {
      throw new Error('ATLAS payload verification failed: no matched faculty assignment payloads returned');
    }

    // 6. Strict mirror reconciliation for class assignments (soft-delete only).
    // Incoming ATLAS rows are reactivated/upserted; missing rows are marked inactive.
    const warnedSubjects = new Set<string>();
    const activeAssignments: Array<{
      teacherId: string;
      subjectId: string;
      sectionId: string;
      schoolYear: string;
      teachingMinutes: number | null;
    }> = [];

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

      await ensureHomeroomGuidanceLabel(subject, homeroomLabelUpdated);
      const teachingMinutes = subject.code.startsWith('HG') ? HOMEROOM_GUIDANCE_MINUTES : null;

      activeAssignments.push({
        teacherId: load.smartTeacherId,
        subjectId: subject.id,
        sectionId: section.id,
        schoolYear: SCHOOL_YEAR,
        teachingMinutes,
      });
    }

    const uniqueActiveAssignments = Array.from(
      new Map(
        activeAssignments.map((a) => [
          `${a.teacherId}|${a.subjectId}|${a.sectionId}|${a.schoolYear}`,
          a,
        ])
      ).values()
    );

    await prisma.$transaction(async (tx) => {
      for (const assignment of uniqueActiveAssignments) {
        await tx.classAssignment.upsert({
          where: {
            teacherId_subjectId_sectionId_schoolYear: {
              teacherId: assignment.teacherId,
              subjectId: assignment.subjectId,
              sectionId: assignment.sectionId,
              schoolYear: assignment.schoolYear,
            },
          },
          update: {
            teachingMinutes: assignment.teachingMinutes,
            isActive: true,
          },
          create: {
            teacherId: assignment.teacherId,
            subjectId: assignment.subjectId,
            sectionId: assignment.sectionId,
            schoolYear: assignment.schoolYear,
            teachingMinutes: assignment.teachingMinutes,
            isActive: true,
          },
        });
      }

      if (uniqueActiveAssignments.length === 0) {
        throw new Error('ATLAS guardrail: empty effective assignment payload; sync aborted to protect existing data');
      }

      const activeKeysWhere = uniqueActiveAssignments.map((assignment) => ({
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        sectionId: assignment.sectionId,
        schoolYear: assignment.schoolYear,
      }));

      const deactivated = await tx.classAssignment.updateMany({
        where: {
          schoolYear: SCHOOL_YEAR,
          isActive: true,
          NOT: {
            OR: activeKeysWhere,
          },
        },
        data: { isActive: false },
      });
      deleted = deactivated.count;
    });

    created = uniqueActiveAssignments.length;

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
        if (tid && sec) {
          if (sec.adviserId !== tid) {
            await prisma.section.update({ where: { id: sec.id }, data: { adviserId: tid } });
          }
          await syncAdvisoryWorkloadEntry({ teacherId: tid, sectionId: sec.id, schoolYear: SCHOOL_YEAR });
        }
      }
      console.log(`[AtlasSync] Advisers synced: ${atlasAdvisers.length} from ATLAS`);
    } catch (advErr: any) {
      console.warn('[AtlasSync] Adviser sync failed:', advErr.message);
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
