/**
 * atlas-miguel-load.ts — Check Miguel Valdez's teaching load directly
 */
import 'dotenv/config';
import http from 'http';

const ATLAS = 'http://100.88.55.125:5001/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN5c3RlbS1hcGlAYXRsYXMubG9jYWwiLCJyb2xlIjoiU1lTVEVNX0FETUlOIiwidXNlcklkIjpudWxsLCJpYXQiOjE3Nzg0Nzg4NDMsImV4cCI6NDkzNDIzODg0M30.VTB3uv8FEB9VbY0W2mUz0Y5q9fn5WaC02sGJ2jodH08';

function get(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res: any) => {
      let b = ''; res.on('data', (c: any) => b += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, d: JSON.parse(b) }); }
        catch { resolve({ s: res.statusCode, raw: b }); }
      });
    }).on('error', reject).setTimeout(15000, function(this: any) { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // Miguel Valdez: ATLAS id=8560, externalId=2359
  const MIGUEL_ATLAS_ID = 8560;

  console.log('=== Miguel Valdez Teaching Load ===');
  console.log('ATLAS id:', MIGUEL_ATLAS_ID, '| externalId: 2359 | email: miguel.valdez@deped.edu.ph\n');

  // Try different schoolYearIds
  for (const syId of [8, 7, 6, 1]) {
    const r = await get(`${ATLAS}/faculty-assignments/${MIGUEL_ATLAS_ID}?schoolYearId=${syId}`);
    const assignments = r.d.assignments ?? [];
    console.log(`schoolYearId=${syId}: ${assignments.length} assignments`);
    if (assignments.length > 0) {
      console.log('  Assignments:');
      assignments.forEach((a: any) => console.log(`    subjectCode=${a.subjectCode} subjectName=${a.subjectName} gradeLevel=${a.gradeLevel} sectionId=${a.sectionId} sectionName=${a.sectionName}`));
    }
  }

  // Also try without schoolYearId
  const rNoSY = await get(`${ATLAS}/faculty-assignments/${MIGUEL_ATLAS_ID}`);
  console.log(`\nNo schoolYearId filter: ${rNoSY.d.assignments?.length ?? 'err'} assignments`);
  if (rNoSY.d.assignments?.length > 0) {
    rNoSY.d.assignments.forEach((a: any) => console.log(`  subjectCode=${a.subjectCode} gradeLevel=${a.gradeLevel} sy=${a.schoolYearId}`));
  }

  // Try different endpoint format
  console.log('\n=== Trying /faculty/:id/assignments ===');
  const r2 = await get(`${ATLAS}/faculty/${MIGUEL_ATLAS_ID}/assignments?schoolYearId=8`);
  console.log(`Status: ${r2.s} | data: ${JSON.stringify(r2.d ?? r2.raw).substring(0, 200)}`);

  // Try to see what schoolYearIds exist on ATLAS
  console.log('\n=== Checking ATLAS school years ===');
  const sy = await get(`${ATLAS}/school-years`);
  console.log(`Status: ${sy.s} | result: ${JSON.stringify(sy.d ?? sy.raw).substring(0, 300)}`);

  // Try /subjects to see what subjects ATLAS has
  console.log('\n=== ATLAS subjects (schoolId=1) ===');
  const subs = await get(`${ATLAS}/subjects?schoolId=1`);
  console.log(`Status: ${subs.s}`);
  const subjects: any[] = subs.d.subjects ?? [];
  console.log(`Subjects: ${subjects.length}`);
  subjects.forEach((s: any) => console.log(`  id=${s.id} code=${s.code} name=${s.name}`));

  // Check if there's a different assignment endpoint structure
  console.log('\n=== Raw summary for Miguel (id 8560) ===');
  const migSum = await get(`${ATLAS}/faculty-assignments/summary?schoolId=1&schoolYearId=8&facultyId=8560`);
  console.log(`Status: ${migSum.s} | ${JSON.stringify(migSum.d ?? migSum.raw).substring(0, 400)}`);
}

main().catch(console.error);
