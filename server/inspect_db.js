const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function inspect() {
  const { data: teams, error } = await supabase.from('teams').select('id, name, cluster, problem_id').limit(10);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Sample Teams:');
  console.table(teams);

  const { data: configs } = await supabase.from('global_config').select('*');
  console.log('Global Config:');
  console.table(configs);
}

inspect();
