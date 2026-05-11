/**
 * explore-aims.ts — Discover AIMS API structure
 */
import 'dotenv/config';
import https from 'https';
import http from 'http';

function req(url: string, method = 'GET', body?: any, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = (url.startsWith('https') ? https : http) as any;
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : undefined;
    const opts = {
      hostname: u.hostname, port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname + u.search, method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    };
    const r = lib.request(opts, (res: any) => {
      let b = ''; res.on('data', (c: any) => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    r.on('error', reject);
    r.setTimeout(8000, () => { r.destroy(); resolve({ status: 0, body: 'TIMEOUT' }); });
    if (data) r.write(data);
    r.end();
  });
}

async function probe(label: string, url: string, method = 'GET', body?: any, headers?: Record<string, string>) {
  try {
    const { status, body: rb } = await req(url, method, body, headers ?? {});
    const preview = rb.substring(0, 200).replace(/\n/g, ' ');
    console.log(`[${status}] ${label}: ${preview}`);
  } catch (e: any) {
    console.log(`[ERR] ${label}: ${e.message}`);
  }
}

async function main() {
  console.log('=== Probing AIMS ===\n');

  // Common AIMS base URLs to try
  const bases = [
    'http://100.88.55.125:5002',
    'http://100.88.55.125:4000',
    'http://100.88.55.125:3001',
    'http://100.88.55.125:8080',
    'http://100.88.55.125:8000',
  ];

  for (const base of bases) {
    await probe(`${base} /`, base + '/');
    await probe(`${base} /api`, base + '/api');
    await probe(`${base} /api/v1`, base + '/api/v1');
    await probe(`${base} /health`, base + '/health');
  }

  console.log('\n=== Trying known Tailscale pattern ===');
  const tailBases = [
    'http://100.88.55.125:5004',
    'http://100.88.55.125:5005',
    'http://100.88.55.125:6000',
    'http://100.88.55.125:7000',
  ];
  for (const base of tailBases) {
    await probe(`${base} /`, base + '/');
    await probe(`${base} /health`, base + '/health');
  }
}

main().catch(console.error);
