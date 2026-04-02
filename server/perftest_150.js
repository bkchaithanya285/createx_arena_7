const axios = require('axios');
const TARGET_URL = 'http://127.0.0.1:8080/api/teams/me/attendance';
const CONCURRENCY = 150;
const BYPASS_SECRET = 'stark-load-test-2024';

async function runTest() {
    console.log(`--- [1/2] Initialization (Zero-DNS Mode) ---`);
    console.log(`Target: ${TARGET_URL}`);
    console.log(`Bypassing Redis/JWT to isolate Controller & DB logic.`);

    const requests = [];
    for(let i=1; i <= CONCURRENCY; i++) {
        const teamNum = (i % 109) || 109; // Spread across 109 teams
        const teamId = `CREATOR-${teamNum.toString().padStart(3, '0')}`;
        
        requests.push(axios.get(TARGET_URL, {
            headers: { 
                'x-load-test-secret': BYPASS_SECRET,
                'x-team-id': teamId
            },
            timeout: 15000
        }));
    }

    console.log(`--- [2/2] Launching ${CONCURRENCY} concurrent requests... ---`);
    const startTime = Date.now();
    
    try {
        const results = await Promise.allSettled(requests);
        const duration = Date.now() - startTime;

        const success = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
        const failures = results.filter(r => r.status === 'rejected' || r.value.status !== 200);

        console.log(`\n--- LOAD TEST RESULTS (150 USERS) ---`);
        console.log(`Total Requests: ${CONCURRENCY}`);
        console.log(`Success Rate: ${((success / CONCURRENCY) * 100).toFixed(2)}% (${success}/${CONCURRENCY})`);
        console.log(`Total Duration: ${duration}ms`);
        console.log(`Average Response Time: ${(duration / CONCURRENCY).toFixed(2)}ms`);

        if (failures.length > 0) {
            console.error(`\n❌ Found ${failures.length} failures:`);
            failures.slice(0, 5).forEach((f, idx) => {
                const msg = f.reason?.response?.data?.error || f.reason?.message || "Unknown error";
                console.error(`- Error ${idx+1}: ${msg}`);
            });
            process.exit(1);
        }

        console.log(`\n✅ TEST PASSED: 0% error rate at peak load simulation.`);
    } catch (err) {
        console.error(`Critical script failure:`, err);
        process.exit(1);
    }
}

runTest();
