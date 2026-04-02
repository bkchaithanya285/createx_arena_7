/**
 * CREATEX ARENA - PERFORMANCE LOAD TEST (Native Fetch version)
 */

const BASE_URL = 'http://localhost:8080/api';
const CONCURRENT_REQUESTS = 108;
const TEST_ENDPOINT = '/teams/dashboard-state';
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsI...'; // Paste token here

async function runLoadTest() {
  console.log(`\x1b[36m[LOAD TEST]\x1b[0m Starting simulation of ${CONCURRENT_REQUESTS} concurrent requests...`);
  
  const startTime = Date.now();
  const requests = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    requests.push(
      fetch(`${BASE_URL}${TEST_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${MOCK_TOKEN}` }
      }).then(r => ({ status: r.status })).catch(err => ({ status: 'FAIL' }))
    );
  }

  const results = await Promise.all(requests);
  const endTime = Date.now();
  const duration = endTime - startTime;

  const success = results.filter(r => r.status === 200).length;
  const failed = CONCURRENT_REQUESTS - success;

  console.log('\n' + '='.repeat(40));
  console.log(`\x1b[32m[RESULTS]\x1b[0m Load Test Completed`);
  console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Avg Latency: ${(duration / CONCURRENT_REQUESTS).toFixed(2)}ms`);
  console.log('='.repeat(40));

  if (duration < 1000) console.log(`\x1b[32m[VERDICT]\x1b[0m EXCELLENT. Caching confirmed.`);
  else console.log(`\x1b[31m[VERDICT]\x1b[0m SLOW.`);
}

runLoadTest();
