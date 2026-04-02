const axios = require('axios');

async function runRaceTest() {
  const problemId = 'CREATEX-MISSION-01';
  const url = 'http://localhost:8080/api/problems/select';
  const secret = 'stark-load-test-2024';

  console.log(`\x1b[36m[RACE TEST]\x1b[0m Starting race for ${problemId} between CREATOR-018 and CREATOR-002 (Cluster A)...`);

  const requests = [
    axios.post(url, { selectedProblemId: problemId }, {
      headers: { 'x-load-test-secret': secret, 'x-team-id': 'CREATOR-018' }
    }).then(r => ({ team: '018', status: r.status, data: r.data })).catch(e => ({ team: '018', status: e.response?.status, error: e.response?.data?.error })),
    
    axios.post(url, { selectedProblemId: problemId }, {
      headers: { 'x-load-test-secret': secret, 'x-team-id': 'CREATOR-002' }
    }).then(r => ({ team: '002', status: r.status, data: r.data })).catch(e => ({ team: '002', status: e.response?.status, error: e.response?.data?.error }))
  ];

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(50));
  console.log(`\x1b[32m[RESULTS]\x1b[0m Duration: ${duration}ms`);
  
  results.forEach(res => {
    const color = res.status === 200 ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}Team ${res.team}:\x1b[0m Status ${res.status} | ${res.data ? 'SUCCESS' : 'FAILED: ' + res.error}`);
  });
  console.log('='.repeat(50));

  const successCount = results.filter(r => r.status === 200).length;
  if (successCount === 1) {
    console.log(`\x1b[32m[VERDICT]\x1b[0m PASS: Exactly one team won the race. Cluster isolation verified.`);
  } else {
    console.log(`\x1b[31m[VERDICT]\x1b[0m FAIL: ${successCount} teams succeeded. Critical race condition detected!`);
  }
}

runRaceTest();
