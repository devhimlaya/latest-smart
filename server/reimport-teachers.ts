/**
 * reimport-teachers.ts
 *
 * Replaces all fake seeded teacher accounts with real teacher data from EnrollPro.
 *
 * Steps:
 *  1. Fetch real teachers from EnrollPro (schoolId=5)
 *  2. Fetch sections from EnrollPro (schoolYearId=8) to get adviser mapping
 *  3. Clear section advisers (avoid FK constraint)
 *  4. Delete all fake TEACHER users (cascade removes Teacher records)
 *  5. Create real teacher users from EnrollPro data
 *  6. Re-assign section advisers from EnrollPro section data
 *
 * Passwords are set to "teacher123" (bcrypt). Teachers can change via settings.
 */
import 'dotenv/config';
import https from 'https';
import http from 'http';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) } as any);

const EP_BASE = 'https://dev-jegs.buru-degree.ts.net/api';
const EP_EMAIL = 'regina.cruz@deped.edu.ph';
const EP_PASSWORD = 'Gx$P*w2$TuKW';
const SCHOOL_ID = 5;
const SCHOOL_YEAR_ID = 8;
const SCHOOL_YEAR = '2026-2027';

function httpPost(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = (lib as any).request({
      hostname: u.hostname, port: u.port || 443,
      path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => { try { resolve(JSON.parse(r)); } catch { reject(new Error(r.substring(0, 300))); } });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('POST timeout')); });
    req.write(data); req.end();
  });
}

function httpGet(url: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    (lib as any).get(url, { headers } as any, (res: any) => {
      let body = '';
      res.on('data', (c: any) => body += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); } catch { reject(new Error(body.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   SMART — Re-import Teachers from EnrollPro              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Login to EnrollPro ──────────────────────────────────────────
  console.log('🔐 Step 1: Authenticating with EnrollPro...');
  const login = await httpPost(`${EP_BASE}/auth/login`, { email: EP_EMAIL, password: EP_PASSWORD });
  const token = login.token ?? login.accessToken;
  if (!token) throw new Error('EnrollPro login failed: ' + JSON.stringify(login));
  const auth = { Authorization: `Bearer ${token}` };
  console.log('   ✔ Authenticated.\n');

  // ── Step 2: Fetch teachers from EnrollPro ───────────────────────────────
  console.log('👩‍🏫 Step 2: Fetching teachers from EnrollPro...');
  const epTeachersResp = await httpGet(
    `${EP_BASE}/integration/v1/faculty?schoolId=${SCHOOL_ID}&page=1&limit=200`,
    auth
  );
  const epTeachers: any[] = epTeachersResp.data ?? [];
  console.log(`   Found ${epTeachers.length} teachers in EnrollPro.\n`);

  if (epTeachers.length === 0) {
    console.error('   ✗ No teachers returned from EnrollPro. Aborting.');
    return;
  }

  // ── Step 3: Fetch sections from EnrollPro for adviser mapping ───────────
  console.log('📚 Step 3: Fetching sections from EnrollPro for adviser mapping...');
  let page = 1;
  let allEpSections: any[] = [];
  while (true) {
    const r = await httpGet(
      `${EP_BASE}/integration/v1/sections?schoolYearId=${SCHOOL_YEAR_ID}&page=${page}&limit=200`,
      auth
    );
    const data: any[] = r.data ?? [];
    if (data.length === 0) break;
    allEpSections = allEpSections.concat(data);
    if (data.length < 200) break;
    page++;
  }
  console.log(`   Found ${allEpSections.length} sections in EnrollPro.\n`);

  // Build map: EnrollPro teacherId → email (for adviser lookup)
  const epTeacherIdToEmail = new Map<number, string>(
    epTeachers.map((t: any) => [t.teacherId, t.email] as [number, string])
  );

  // Build map: section name → adviser email
  const sectionNameToAdviserEmail = new Map<string, string>();
  for (const sec of allEpSections) {
    if (sec.advisorId && epTeacherIdToEmail.has(sec.advisorId)) {
      sectionNameToAdviserEmail.set(sec.name, epTeacherIdToEmail.get(sec.advisorId)!);
    }
  }
  console.log(`   Adviser mappings found: ${sectionNameToAdviserEmail.size}\n`);

  // ── Step 4: Clear section advisers ─────────────────────────────────────
  console.log('🔄 Step 4: Clearing current section advisers...');
  const cleared = await p.section.updateMany({ data: { adviserId: null } });
  console.log(`   Cleared ${cleared.count} section adviser assignments.\n`);

  // ── Step 5: Delete all fake TEACHER users ──────────────────────────────
  console.log('🗑️  Step 5: Deleting fake teacher accounts...');
  const deleted = await p.user.deleteMany({ where: { role: Role.TEACHER } });
  console.log(`   Deleted ${deleted.count} fake teacher users.\n`);

  // ── Step 6: Create real teachers from EnrollPro data ───────────────────
  console.log('✨ Step 6: Creating real teacher accounts from EnrollPro...');
  const teacherPassword = await bcrypt.hash('DepEd2026!', 10);
  let created = 0;
  let skipped = 0;
  const emailToTeacherId = new Map<string, string>();

  for (const t of epTeachers) {
    const email: string = t.email?.toLowerCase() ?? '';
    if (!email) { skipped++; continue; }

    // Username: part before @ (e.g., "angelo.aquino")
    const username = email.split('@')[0];
    const firstName = toTitleCase(t.firstName ?? '');
    const lastName = toTitleCase(t.lastName ?? '');
    const employeeId: string = String(t.employeeId ?? t.teacherId);

    try {
      const user = await p.user.create({
        data: {
          username,
          email,
          password: teacherPassword,
          role: Role.TEACHER,
          firstName,
          lastName,
          teacher: {
            create: {
              employeeId,
              specialization: t.specialization ?? null,
            },
          },
        },
        include: { teacher: { select: { id: true } } },
      }) as any;
      emailToTeacherId.set(email, user.teacher.id);
      created++;
    } catch (err: any) {
      console.warn(`   ⚠ Could not create ${email}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`   ✔ Created: ${created}, Skipped: ${skipped}\n`);

  // ── Step 7: Re-assign section advisers ────────────────────────────────
  console.log('🏫 Step 7: Re-assigning section advisers...');
  const smartSections = await p.section.findMany({ where: { schoolYear: SCHOOL_YEAR } });
  let assignedAdvisers = 0;
  let noAdviser = 0;

  for (const sec of smartSections) {
    const adviserEmail = sectionNameToAdviserEmail.get(sec.name);
    if (!adviserEmail) { noAdviser++; continue; }

    const teacherId = emailToTeacherId.get(adviserEmail.toLowerCase());
    if (!teacherId) { noAdviser++; continue; }

    await p.section.update({
      where: { id: sec.id },
      data: { adviserId: teacherId },
    });
    assignedAdvisers++;
  }
  console.log(`   ✔ Assigned advisers: ${assignedAdvisers}, No adviser found: ${noAdviser}\n`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const finalTeachers = await p.teacher.count();
  const finalSectionsWithAdviser = await p.section.count({ where: { adviserId: { not: null } } });

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                        RESULT                            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Teachers created:       ${String(created).padEnd(28)} ║`);
  console.log(`║  Sections with adviser:  ${String(finalSectionsWithAdviser).padEnd(28)} ║`);
  console.log(`║  Total teachers in DB:   ${String(finalTeachers).padEnd(28)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Sample teacher to verify
  const sample = await p.user.findFirst({
    where: { role: Role.TEACHER, email: { contains: 'miguel.valdez' } },
    include: { teacher: true },
  }) as any;
  if (sample) {
    console.log(`✔ Miguel Valdez: email=${sample.email}, empId=${sample.teacher?.employeeId}`);
  } else {
    console.log('⚠ Miguel Valdez not found (check EnrollPro data)');
  }
}

main().then(() => p['$disconnect']()).catch(console.error);
