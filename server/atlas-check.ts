/**
 * atlas-check.ts — Quick ATLAS API diagnostic
 * Run: npx tsx atlas-check.ts
 */
import 'dotenv/config';
import http from 'http';
import https from 'https';

const ATLAS = 'http://100.88.55.125:5001/api/v1';
const ENROLLPRO = 'https://dev-jegs.buru-degree.ts.net/api';

// ATLAS SYSTEM_ADMIN token (long-lived service token)
const ATLAS_SYSTEM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN5c3RlbS1hcGlAYXRsYXMubG9jYWwiLCJyb2xlIjoiU1lTVEVNX0FETUlOIiwidXNlcklkIjpudWxsLCJpYXQiOjE3Nzg0Nzg4NDMsImV4cCI6NDkzNDIzODg0M30.VTB3uv8FEB9VbY0W2mUz0Y5q9fn5WaC02sGJ2jodH08';

function get(url: string, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const headers: any = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    (lib as any).get(url, { headers }, (res: any) => {
      let body = '';
      res.on('data', (c: any) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, raw: body.substring(0, 300) }); }
      });
    }).on('error', reject).setTimeout(15000, function(this: any) { this.destroy(); reject(new Error('timeout: ' + url)); });
  });
}

function post(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = (lib as any).request({
      hostname: u.hostname, port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(r) }); } catch { resolve({ status: res.statusCode, raw: r }); }});
    });
    req.on('error', reject); req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data); req.end();
  });
}

async function main() {
  console.log('\n=== ATLAS API Diagnostic ===\n');

  // 1. Get ATLAS token for regina.cruz (she has ATLAS role=officer)
  console.log('1. Login to ATLAS as regina.cruz...');
  const reginaLogin = await post(`${ATLAS}/auth/login`, { email: 'regina.cruz@deped.edu.ph', password: 'Gx$P*w2$TuKW' });
  const reginaToken = reginaLogin.data?.token ?? '';
  console.log(`   Status: ${reginaLogin.status} | role: ${reginaLogin.data?.user?.role} | token length: ${reginaToken.length}`);

  // 2. Try /faculty with no schoolId filter using SYSTEM_ADMIN
  console.log('\n2. ATLAS /faculty (no schoolId) with SYSTEM_ADMIN...');
  const fNoFilter = await get(`${ATLAS}/faculty`, ATLAS_SYSTEM_TOKEN);
  console.log(`   Status: ${fNoFilter.status} | keys: ${Object.keys(fNoFilter.data || {}).join(', ')}`);
  if (fNoFilter.data?.faculty) console.log(`   faculty count: ${fNoFilter.data.faculty.length}`);
  if (fNoFilter.data?.faculty?.length > 0) console.log(`   sample: ${JSON.stringify(fNoFilter.data.faculty[0])}`);

  // 3. Try /faculty?schoolId=5 with SYSTEM_ADMIN
  console.log('\n3. ATLAS /faculty?schoolId=5 with SYSTEM_ADMIN...');
  const f5 = await get(`${ATLAS}/faculty?schoolId=5`, ATLAS_SYSTEM_TOKEN);
  console.log(`   Status: ${f5.status} | faculty count: ${f5.data?.faculty?.length ?? 'N/A'}`);

  // 4. Try /faculty?schoolId=5 with regina token (if we have it)
  if (reginaToken) {
    console.log('\n4. ATLAS /faculty?schoolId=5 with regina (officer)...');
    const fRegina = await get(`${ATLAS}/faculty?schoolId=5`, reginaToken);
    console.log(`   Status: ${fRegina.status} | faculty count: ${fRegina.data?.faculty?.length ?? 'N/A'}`);
    if (fRegina.data?.faculty?.length > 0) {
      console.log(`   Sample:`, JSON.stringify(fRegina.data.faculty[0]));
      // Look for Miguel Valdez
      const miguel = fRegina.data.faculty.find((f: any) => 
        (f.name ?? '').toLowerCase().includes('valdez') ||
        (f.firstName ?? '').toLowerCase().includes('miguel') ||
        (f.lastName ?? '').toLowerCase().includes('valdez')
      );
      if (miguel) console.log('   *** MIGUEL VALDEZ FOUND:', JSON.stringify(miguel));
      else console.log('   (Miguel Valdez not found in faculty list)');
    }
  }

  // 5. Try /schools or /school to see what schools exist
  console.log('\n5. ATLAS /schools...');
  const schools = await get(`${ATLAS}/schools`, ATLAS_SYSTEM_TOKEN);
  console.log(`   Status: ${schools.status} | result: ${JSON.stringify(schools.data ?? schools.raw).substring(0, 300)}`);

  // 6. Try faculty-assignments summary
  console.log('\n6. ATLAS /faculty-assignments/summary?schoolId=5&schoolYearId=8 with SYSTEM_ADMIN...');
  const summary = await get(`${ATLAS}/faculty-assignments/summary?schoolId=5&schoolYearId=8`, ATLAS_SYSTEM_TOKEN);
  console.log(`   Status: ${summary.status}`);
  if (summary.data?.faculty) console.log(`   faculty count: ${summary.data.faculty.length}`);
  else console.log(`   result: ${JSON.stringify(summary.data ?? summary.raw).substring(0, 300)}`);

  // 7. Try with regina token on summary
  if (reginaToken) {
    console.log('\n7. ATLAS /faculty-assignments/summary?schoolId=5&schoolYearId=8 with regina...');
    const summaryR = await get(`${ATLAS}/faculty-assignments/summary?schoolId=5&schoolYearId=8`, reginaToken);
    console.log(`   Status: ${summaryR.status}`);
    if (summaryR.data?.faculty) {
      console.log(`   faculty count: ${summaryR.data.faculty.length}`);
      if (summaryR.data.faculty.length > 0) console.log(`   sample: ${JSON.stringify(summaryR.data.faculty[0])}`);
    } else console.log(`   result: ${JSON.stringify(summaryR.data ?? summaryR.raw).substring(0, 400)}`);
  }

  // 8. Try EnrollPro sections to see gradeLevel structure
  console.log('\n8. EnrollPro /integration/v1/sections (gradeLevel structure)...');
  const epLogin = await post(`${ENROLLPRO}/auth/login`, { email: 'regina.cruz@deped.edu.ph', password: 'Gx$P*w2$TuKW' });
  const epToken = epLogin.data?.token ?? '';
  if (epToken) {
    const sections = await get(`${ENROLLPRO}/integration/v1/sections?schoolYearId=8&page=1&limit=3`, epToken);
    console.log(`   Status: ${sections.status}`);
    if (sections.data?.data?.length > 0) {
      console.log(`   Sample section:`, JSON.stringify(sections.data.data[0], null, 2));
    }
  }

  console.log('\n=== Done ===\n');
}

main().catch(console.error);
