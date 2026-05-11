/**
 * atlas-find-school.ts — Find the correct ATLAS school ID for BEC
 */
import http from 'http';

const ATLAS = 'http://100.88.55.125:5001/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN5c3RlbS1hcGlAYXRsYXMubG9jYWwiLCJyb2xlIjoiU1lTVEVNX0FETUlOIiwidXNlcklkIjpudWxsLCJpYXQiOjE3Nzg0Nzg4NDMsImV4cCI6NDkzNDIzODg0M30.VTB3uv8FEB9VbY0W2mUz0Y5q9fn5WaC02sGJ2jodH08';

// Use regina.cruz ATLAS token (officer role)
const REGINA_ATLAS_TOKEN_PLACEHOLDER = '__REGINA__'; // filled in main

function get(url: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { Authorization: `Bearer ${token}` } }, (res: any) => {
      let body = '';
      res.on('data', (c: any) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, raw: body.substring(0, 200) }); }
      });
    }).on('error', reject).setTimeout(8000, function(this: any) { this.destroy(); reject(new Error('timeout')); });
  });
}

function post(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(r) }); } catch { resolve({ status: res.statusCode, raw: r }); } });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function main() {
  // Get regina's ATLAS token first
  const reginaLogin = await post('https://dev-jegs.buru-degree.ts.net/api/auth/login', {
    email: 'regina.cruz@deped.edu.ph', password: 'Gx$P*w2$TuKW'
  });
  // Actually regina's ATLAS direct token
  const atlasLogin = await new Promise<any>((resolve) => {
    const data = JSON.stringify({ email: 'regina.cruz@deped.edu.ph', password: 'Gx$P*w2$TuKW' });
    const req = http.request({
      hostname: '100.88.55.125', port: 5001, path: '/api/v1/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => resolve(JSON.parse(r)));
    });
    req.write(data); req.end();
  });
  const reginaToken = atlasLogin.token ?? '';
  console.log(`Regina ATLAS token role: ${atlasLogin.user?.role}, length: ${reginaToken.length}`);

  // Scan schoolIds 1-20 for faculty
  console.log('\nScanning ATLAS schoolIds 1-20 for faculty...');
  for (let id = 1; id <= 20; id++) {
    const r = await get(`${ATLAS}/faculty?schoolId=${id}`, TOKEN).catch(() => ({ status: 'err', data: null }));
    const count = r.data?.faculty?.length ?? -1;
    if (count > 0) {
      console.log(`  schoolId=${id}: ${count} faculty FOUND!`);
      console.log(`  Sample: ${JSON.stringify(r.data.faculty[0])}`);
      // Check for Miguel Valdez
      const miguel = r.data.faculty.find((f: any) =>
        JSON.stringify(f).toLowerCase().includes('valdez') ||
        JSON.stringify(f).toLowerCase().includes('miguel')
      );
      if (miguel) console.log(`  ** MIGUEL: ${JSON.stringify(miguel)}`);
    } else if (r.status !== 200) {
      console.log(`  schoolId=${id}: status=${r.status}`);
    } else {
      process.stdout.write(`  schoolId=${id}: 0  `);
      if (id % 5 === 0) console.log();
    }
  }

  // Also try the summary without schoolId constraint
  console.log('\n\nSummary endpoint without schoolId...');
  const sumNoSchool = await get(`${ATLAS}/faculty-assignments/summary?schoolYearId=8`, TOKEN);
  console.log(`  Status: ${sumNoSchool.status}`);
  if (sumNoSchool.data?.faculty) {
    console.log(`  faculty count: ${sumNoSchool.data.faculty.length}`);
    if (sumNoSchool.data.faculty.length > 0) {
      console.log(`  Sample: ${JSON.stringify(sumNoSchool.data.faculty[0])}`);
    }
  } else {
    console.log(`  result: ${JSON.stringify(sumNoSchool.data ?? sumNoSchool.raw).substring(0, 400)}`);
  }

  // Try with reginaToken
  if (reginaToken) {
    console.log('\nSummary with reginaToken (officer)...');
    const sumRegina = await get(`${ATLAS}/faculty-assignments/summary?schoolYearId=8`, reginaToken);
    console.log(`  Status: ${sumRegina.status}`);
    if (sumRegina.data?.faculty) {
      console.log(`  faculty count: ${sumRegina.data.faculty.length}`);
      if (sumRegina.data.faculty.length > 0) {
        console.log(`  Sample: ${JSON.stringify(sumRegina.data.faculty[0])}`);
      }
    } else {
      console.log(`  result: ${JSON.stringify(sumRegina.data ?? sumRegina.raw).substring(0, 400)}`);
    }
  }

  // Try /faculty endpoint with reginaToken and different schoolIds
  if (reginaToken) {
    console.log('\nScanning with reginaToken...');
    for (let id = 1; id <= 10; id++) {
      const r = await get(`${ATLAS}/faculty?schoolId=${id}`, reginaToken).catch(() => ({ status: 'err', data: null }));
      const count = r.data?.faculty?.length ?? -1;
      if (count > 0) {
        console.log(`  schoolId=${id}: ${count} faculty FOUND with reginaToken!`);
        console.log(`  Sample: ${JSON.stringify(r.data.faculty[0])}`);
      }
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
