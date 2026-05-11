import 'dotenv/config';
import http from 'http';

function post(url: string, body: any, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: Number(u.port) || 80,
      path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => resolve(JSON.parse(r)));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}
function get(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    http.get({ hostname: u.hostname, port: Number(u.port) || 80, path: u.pathname, headers }, (res: any) => {
      let r = ''; res.on('data', (c: any) => r += c);
      res.on('end', () => resolve(JSON.parse(r)));
    }).on('error', reject);
  });
}
async function main() {
  const login = await post('http://localhost:5003/api/auth/login', { email: 'admin@deped.edu.ph', password: 'DepEdSY2026!' });
  const token = login.token;
  console.log('Logged in as:', login.user?.email);
  const status = await get('http://localhost:5003/api/admin/atlas-sync/status', { Authorization: `Bearer ${token}` });
  console.log('Sync status:');
  console.log('  running:', status.running);
  console.log('  lastSyncAt:', status.lastSyncAt);
  if (status.result) {
    console.log('  matched:', status.result.matched);
    console.log('  created:', status.result.created);
    console.log('  deleted:', status.result.deleted);
    console.log('  teachersWithLoads:', status.result.teachersWithLoads);
    console.log('  errors:', status.result.errors?.length ?? 0);
  } else {
    console.log('  No sync result yet (still running or not started)');
  }
}
main().catch(console.error);
