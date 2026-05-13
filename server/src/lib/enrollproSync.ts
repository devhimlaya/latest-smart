/**
 * enrollproSync.ts
 *
 * Syncs student and section data from EnrollPro into SMART's local DB.
 * Runs on server start and every N minutes (default 30).
 * Also manually triggerable via POST /api/admin/enrollpro-sync/run
 *
 * What it syncs:
 *  - Sections (with adviserId from EnrollPro integration v1 faculty advisory info)
 *  - Students (Student model, keyed by LRN)
 *  - Enrollments (Enrollment model, linking student ↔ section)
 *
 * Data sources — ALL NO-AUTH integration v1 endpoints:
 *  - Active SY:     GET /integration/v1/school-year
 *  - Faculty:       GET /integration/v1/faculty  (has advisorySectionId/Name directly)
 *  - Sections:      GET /integration/v1/sections (has advisingTeacher embedded)
 *  - Learners:      GET /integration/v1/learners (paginated, all enrolled)
 *
 * Read-only from EnrollPro. Only writes to SMART's smart_db.
 */

import {
  getIntegrationV1ActiveSchoolYear,
  getIntegrationV1Faculty,
  getIntegrationV1Sections,
  getAllIntegrationV1Learners,
  getEnrollProTeachers,
} from './enrollproClient';
import { prisma } from './prisma';
import type { GradeLevel } from '@prisma/client';
import { broadcastSyncStatus } from './sseManager';

// ---------------------------------------------------------------------------
// Grade level mapping
// ---------------------------------------------------------------------------
function mapGradeLevel(name: string | null | undefined): GradeLevel | null {
  const n = (name ?? '').toLowerCase();
  if (n.includes('10')) return 'GRADE_10';
  if (n.includes('7'))  return 'GRADE_7';
  if (n.includes('8'))  return 'GRADE_8';
  if (n.includes('9'))  return 'GRADE_9';
  return null;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let syncRunning = false;
let lastSyncAt: Date | null = null;
let lastSyncResult: {
  advisoriesSynced: number;
  studentsSynced: number;
  teachersMatched: number;
  errors: string[];
} | null = null;

export function getEnrollProSyncStatus() {
  return { syncRunning, lastSyncAt, lastSyncResult };
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------
export async function runEnrollProSync() {
  if (syncRunning) {
    console.log('[EnrollProSync] Already running, skipping.');
    return lastSyncResult;
  }

  syncRunning = true;
  // Notify clients that sync has started
  broadcastSyncStatus({ type: 'ENROLLPRO_SYNC_STARTED', timestamp: new Date() });

  const errors: string[] = [];
  let advisoriesSynced = 0;
  let studentsSynced = 0;
  let teachersMatched = 0;

  try {
    // 1. Get active school year from EnrollPro Integration v1 (no auth)
    let schoolYearId: number;
    let schoolYearLabel: string;
    try {
      const activeSY = await getIntegrationV1ActiveSchoolYear();
      schoolYearId = activeSY.id;
      schoolYearLabel = activeSY.yearLabel;
      console.log(`[EnrollProSync] Active school year: ${schoolYearLabel} (id=${schoolYearId})`);
    } catch (err: any) {
      schoolYearId = parseInt(process.env.ENROLLPRO_SCHOOL_YEAR_ID ?? '38', 10);
      schoolYearLabel = process.env.ENROLLPRO_SCHOOL_YEAR_LABEL ?? '2026-2027';
      console.warn(`[EnrollProSync] Could not fetch active SY, using env fallback: ${schoolYearLabel}`);
    }

    // 2. Fetch EnrollPro teachers + integration sections.
    // Use the full teacher list as the source of teacher IDs, then read advisory
    // assignments from sections. This avoids missing advisers when the faculty
    // feed is incomplete or out of sync.
    const epTeachers = await getEnrollProTeachers();
    const epTeacherIdToEmpId = new Map<number, string>(
      epTeachers.map((t) => [Number(t.id), String(t.employeeId)])
    );
    console.log(`[EnrollProSync] Loaded ${epTeachers.length} teachers from EnrollPro`);

    // 3. Build SMART teacher lookup by employeeId
    const smartTeachers = await prisma.teacher.findMany({
      select: { id: true, employeeId: true },
    });
    const empIdToSmartTeacherId = new Map<string, string>(
      smartTeachers.filter((t) => t.employeeId).map((t) => [t.employeeId!, t.id])
    );
    console.log(`[EnrollProSync] Loaded ${smartTeachers.length} SMART teachers`);

    // 4. Fetch all sections from EnrollPro integration v1 (no auth)
    const epSections = await getIntegrationV1Sections(schoolYearId);
    console.log(`[EnrollProSync] Loaded ${epSections.length} sections from EnrollPro`);

    // 5. Upsert ALL sections into SMART
    const epSectionNameToSmartSectionId = new Map<string, string>();

    for (const epSection of epSections) {
      try {
        const gradeLevelName: string = epSection.gradeLevel?.name ?? '';
        const gradeLevel = mapGradeLevel(gradeLevelName);
        if (!gradeLevel) {
          errors.push(`Unknown grade level "${gradeLevelName}" for section "${epSection.name}"`);
          continue;
        }

        // Resolve adviser
        const epAdviserTeacherId: number | undefined = epSection.advisingTeacher?.id;
        const adviserEmployeeId = epAdviserTeacherId ? epTeacherIdToEmpId.get(epAdviserTeacherId) : undefined;
        const teacherId = adviserEmployeeId ? (empIdToSmartTeacherId.get(adviserEmployeeId) ?? null) : null;
        if (teacherId) teachersMatched++;

        const section = await (prisma.section as any).upsert({
          where: {
            name_gradeLevel_schoolYear: {
              name: epSection.name,
              gradeLevel,
              schoolYear: schoolYearLabel,
            },
          },
          update: { adviserId: teacherId },
          create: {
            name: epSection.name,
            gradeLevel,
            schoolYear: schoolYearLabel,
            adviserId: teacherId,
          },
        });

        epSectionNameToSmartSectionId.set(epSection.name, section.id);
        if (epSection.advisingTeacher) advisoriesSynced++;
      } catch (err: any) {
        errors.push(`Section "${epSection.name}": ${err.message}`);
      }
    }
    console.log(`[EnrollProSync] Sections upserted: ${epSectionNameToSmartSectionId.size}`);

    // 6. Fetch ALL enrolled learners
    console.log(`[EnrollProSync] Fetching all learners from Integration v1...`);
    let allLearners: any[] = [];
    try {
      allLearners = await getAllIntegrationV1Learners(schoolYearId);
      console.log(`[EnrollProSync] Fetched ${allLearners.length} learners`);
    } catch (err: any) {
      errors.push(`Integration v1 learners fetch failed: ${err.message}`);
    }

    // 7. Upsert each learner + their enrollment
    for (const record of allLearners) {
      if (record.status !== 'ENROLLED') continue;

      const learner = record.learner;
      const sectionName: string = record.section?.name ?? '';
      const gradeLevelName: string = record.gradeLevel?.name ?? '';

      if (!learner?.lrn) continue;

      let resolvedSectionId = epSectionNameToSmartSectionId.get(sectionName);
      if (!resolvedSectionId) {
        const gradeLevel = mapGradeLevel(gradeLevelName);
        if (gradeLevel) {
          try {
            const sec = await (prisma.section as any).upsert({
              where: {
                name_gradeLevel_schoolYear: {
                  name: sectionName,
                  gradeLevel,
                  schoolYear: schoolYearLabel,
                },
              },
              update: {},
              create: { name: sectionName, gradeLevel, schoolYear: schoolYearLabel, adviserId: null },
            });
            epSectionNameToSmartSectionId.set(sectionName, sec.id);
            resolvedSectionId = sec.id;
          } catch { /* ignore */ }
        }
      }

      if (!resolvedSectionId) continue;

      try {
        const saved = await prisma.student.upsert({
          where: { lrn: learner.lrn },
          update: {
            firstName: learner.firstName,
            lastName: learner.lastName,
            middleName: learner.middleName ?? null,
            gender: learner.sex ?? null,
            birthDate: learner.birthdate ? new Date(learner.birthdate) : undefined,
          },
          create: {
            lrn: learner.lrn,
            firstName: learner.firstName,
            lastName: learner.lastName,
            middleName: learner.middleName ?? null,
            suffix: learner.extensionName ?? null,
            gender: learner.sex ?? null,
            birthDate: learner.birthdate ? new Date(learner.birthdate) : null,
          },
        });

        await prisma.enrollment.upsert({
          where: {
            studentId_sectionId_schoolYear: {
              studentId: saved.id,
              sectionId: resolvedSectionId,
              schoolYear: schoolYearLabel,
            },
          },
          update: { status: 'ENROLLED' },
          create: {
            studentId: saved.id,
            sectionId: resolvedSectionId,
            schoolYear: schoolYearLabel,
            status: 'ENROLLED',
          },
        });

        studentsSynced++;
      } catch (err: any) {
        errors.push(`Student LRN ${learner.lrn}: ${err.message}`);
      }
    }

    lastSyncResult = { advisoriesSynced, studentsSynced, teachersMatched, errors };
    lastSyncAt = new Date();
    
    // Update last sync time in settings
    try {
      await prisma.systemSettings.update({
        where: { id: 'main' },
        data: { lastEnrollProSync: lastSyncAt }
      });
    } catch { /* ignore if settings missing */ }

    console.log(
      `[EnrollProSync] ✓ Done: advisories=${advisoriesSynced}, students=${studentsSynced}, ` +
      `matched=${teachersMatched}, errors=${errors.length}`
    );

    // Notify clients that sync is complete
    broadcastSyncStatus({
      type: 'ENROLLPRO_SYNC_COMPLETE',
      timestamp: lastSyncAt,
      result: lastSyncResult
    });

    return lastSyncResult;
  } catch (err: any) {
    console.error('[EnrollProSync] Fatal error:', err.message);
    errors.push(`Fatal: ${err.message}`);
    lastSyncResult = { advisoriesSynced, studentsSynced, teachersMatched, errors };
    
    // Notify clients of failure
    broadcastSyncStatus({
      type: 'ENROLLPRO_SYNC_FAILED',
      timestamp: new Date(),
      error: err.message
    });

    return lastSyncResult;
  } finally {
    syncRunning = false;
  }
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------
export function startEnrollProSyncScheduler(intervalMin = 30) {
  console.log(`[EnrollProSync] Scheduler started — syncing every ${intervalMin} min.`);
  runEnrollProSync();
  setInterval(() => runEnrollProSync(), intervalMin * 60 * 1000);
}
