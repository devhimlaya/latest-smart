/**
 * atlas-inspect.ts — Check teaching load assignments with correct schoolId=1
 */
import 'dotenv/config';
import http from 'http';
import https from 'https';

const ATLAS = 'http://100.88.55.125:5001/api/v1';
const ENROLLPRO = 'https://dev-jegs.buru-degree.ts.net/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN5c3RlbS1hcGlAYXRsYXMubG9jYWwiLCJyb2xlIjoiU1lTVEVNX0FETUlOIiwidXNlcklkIjpudWxsLCJpYXQiOjE3Nzg0Nzg4NDMsImV4cCI6NDkzNDIzODg0M30.VTB3uv8FEB9VbY0W2mUz0Y5q9fn5WaC02sGJ2jodH08';

function get(url: string, token = TOKEN): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    (lib as any).get(url, { headers: { Authorization: `Bearer ${token}` } }, (res: any) => {
      let b = ''; res.on('data', (c: any) => b += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, d: JSON.parse(b) }); }
        catch { resolve({ s: res.statusCode, raw: b.substring(0, 300) }); }
      });
    }).on('error', reject).setTimeout(15000, function(this: any) { this.destroy(); reject(new Error('timeout: ' + url)); });
  });
}

async function main() {
  console.log('=== ATLAS Inspect (schoolId=1) ===\n');

  // 1. Full faculty list
  const fac = await get(`${ATLAS}/faculty?schoolId=1`);
  const faculty: any[] = fac.d.faculty ?? [];
  console.log(`Faculty count: ${faculty.length}`);

  // Search for Valdez
  const valdezList = faculty.filter((f: any) => f.lastName?.toLowerCase().includes('valdez'));
  console.log(`\nTeachers with lastName 'valdez': ${valdezList.length}`);
  valdezList.forEach((f: any) => console.log(`  id=${f.id} extId=${f.externalId} name=${f.firstName} ${f.lastName} email=${f.contactInfo}`));

  // Teacher miguel.valdez@deped.edu.ph
  const miguelByEmail = faculty.find((f: any) => f.contactInfo === 'miguel.valdez@deped.edu.ph');
  const miguelByName = faculty.find((f: any) => f.firstName === 'MIGUEL' && f.lastName === 'VALDEZ');
  console.log('\nmiguel.valdez@deped.edu.ph in ATLAS:', miguelByEmail ? JSON.stringify({ id: miguelByEmail.id, extId: miguelByEmail.externalId, name: `${miguelByEmail.firstName} ${miguelByEmail.lastName}` }) : 'NOT FOUND');
  console.log('MIGUEL VALDEZ by name:', miguelByName ? JSON.stringify({ id: miguelByName.id, extId: miguelByName.externalId }) : 'NOT FOUND');

  // Check all faculty names
  console.log('\nAll faculty (id, name, extId, email):');
  faculty.forEach((f: any) => console.log(`  [${f.id}] extId=${f.externalId} ${f.firstName} ${f.lastName} <${f.contactInfo}>`));

  // 2. Faculty assignments summary
  console.log('\n=== Faculty Assignments Summary (schoolId=1, schoolYearId=8) ===');
  const sum = await get(`${ATLAS}/faculty-assignments/summary?schoolId=1&schoolYearId=8`);
  console.log(`Status: ${sum.s}`);
  const summaryFaculty: any[] = sum.d.faculty ?? [];
  console.log(`Faculty with assignments: ${summaryFaculty.length}`);
  if (summaryFaculty.length > 0) {
    console.log('Sample:', JSON.stringify(summaryFaculty[0], null, 2));
    // Check Miguel
    const miguelSummary = summaryFaculty.find((f: any) => f.facultyId === 8457 || f.name?.toLowerCase().includes('valdez'));
    if (miguelSummary) console.log('\nMiguel in summary:', JSON.stringify(miguelSummary, null, 2));
  }
}

main().catch(console.error);
