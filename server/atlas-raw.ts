/**
 * atlas-raw.ts — Dump raw assignment data for Miguel Valdez
 */
import http from 'http';

const ATLAS = 'http://100.88.55.125:5001/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN5c3RlbS1hcGlAYXRsYXMubG9jYWwiLCJyb2xlIjoiU1lTVEVNX0FETUlOIiwidXNlcklkIjpudWxsLCJpYXQiOjE3Nzg0Nzg4NDMsImV4cCI6NDkzNDIzODg0M30.VTB3uv8FEB9VbY0W2mUz0Y5q9fn5WaC02sGJ2jodH08';

function get(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res: any) => {
      let b = ''; res.on('data', (c: any) => b += c);
      res.on('end', () => resolve(b));
    }).on('error', reject).setTimeout(15000, function(this: any) { this.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // Raw dump of Miguel's assignments
  console.log('=== RAW: /faculty-assignments/8560?schoolYearId=8 ===');
  const raw = await get(`${ATLAS}/faculty-assignments/8560?schoolYearId=8`);
  console.log(raw);

  console.log('\n=== RAW: /faculty-assignments/8560 (no filter) ===');
  const raw2 = await get(`${ATLAS}/faculty-assignments/8560`);
  console.log(raw2);

  // Also check a teacher who has assignments in the summary - andres.aquino has subjectCount=0 too
  // Let's check first 5 faculty assignments to see if anyone has data
  console.log('\n=== Checking first 10 faculty for any assignments ===');
  const facRaw = await get(`${ATLAS}/faculty?schoolId=1`);
  const fac = JSON.parse(facRaw).faculty.slice(0, 10);
  for (const f of fac) {
    const aRaw = await get(`${ATLAS}/faculty-assignments/${f.id}?schoolYearId=8`);
    const a = JSON.parse(aRaw);
    const count = a.assignments?.length ?? 0;
    if (count > 0) {
      console.log(`\n[${f.id}] ${f.firstName} ${f.lastName}: ${count} assignments`);
      console.log(JSON.stringify(a.assignments, null, 2));
    } else {
      process.stdout.write(`[${f.id}]=0 `);
    }
  }
}

main().catch(console.error);
