import https from 'https';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const ENROLLPRO_BASE = 'https://dev-jegs.buru-degree.ts.net/api';
  
  console.log('Fetching active school year...');
  const syRes = await fetchJson(`${ENROLLPRO_BASE}/integration/v1/school-year`);
  const activeSy = syRes.data;
  console.log(`Active School Year: ${activeSy.yearLabel} (ID: ${activeSy.id})`);

  console.log('Fetching learner statistics...');
  const learnersRes = await fetchJson(`${ENROLLPRO_BASE}/integration/v1/learners?schoolYearId=${activeSy.id}&page=1&limit=1`);
  const totalStudents = learnersRes.meta.total;
  
  console.log('Fetching dashboard stats (public branding part)...');
  const publicRes = await fetchJson(`${ENROLLPRO_BASE}/settings/public`);
  
  console.log('\n--- EnrollPro Student Statistics ---');
  console.log(`Total Enrolled Students: ${totalStudents}`);
  console.log(`School Year: ${activeSy.yearLabel}`);
  console.log(`Enrollment Phase: ${publicRes.enrollmentPhase}`);
  console.log('------------------------------------');
}

main().catch(console.error);
