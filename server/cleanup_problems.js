const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'c:/projects/createx_aren/server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function cleanup() {
  try {
    console.log('--- CREATEX Arena Problem Seeding v2.0 ---');
    console.log('1. Loading real problem statements from JSON...');
    
    // Load parts
    const part1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems_data_part1.json'), 'utf8'));
    const part2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems_data_part2.json'), 'utf8'));
    const part3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems_data_part3.json'), 'utf8'));
    
    const rawProblems = [...part1, ...part2, ...part3];
    console.log(`Loaded ${rawProblems.length} problems.`);

    console.log('2. Cleaning up existing database records...');
    const { error: delError } = await supabase.from('problems').delete().neq('id', 'NONE');
    if (delError) {
      throw new Error(`Delete error: ${delError.message}`);
    }
    console.log('Existing problems cleared.');

    console.log('3. Preparing mission payloads with ID format: CREATEX-MISSION-ID-XXX');
    const problems = rawProblems.map(p => ({
      id: `CREATEX-MISSION-ID-${p.id.toString().padStart(3, '0')}`,
      title: p.title,
      description: p.description,
      is_revealed: false,
      is_details_revealed: false
    }));

    console.log(`4. Inserting ${problems.length} records in chunks...`);
    for (let i = 0; i < problems.length; i += 10) {
      const chunk = problems.slice(i, i + 10);
      const { data, error } = await supabase.from('problems').insert(chunk);
      if (error) {
        console.error(`Insert error at chunk starting at index ${i}:`, error.message);
        throw error;
      }
      console.log(`Inserted chunk ${Math.floor(i/10) + 1}/${Math.ceil(problems.length/10)}`);
    }

    console.log('\n✅ SUCCESS: 43 real challenges seeded with Mission ID formatting.');
    
    // Cleanup JSON files
    fs.unlinkSync(path.join(__dirname, 'problems_data_part1.json'));
    fs.unlinkSync(path.join(__dirname, 'problems_data_part2.json'));
    fs.unlinkSync(path.join(__dirname, 'problems_data_part3.json'));
    console.log('Temporary data files removed.');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FAILED:', err.message);
    process.exit(1);
  }
}

cleanup();
