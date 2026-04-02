const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function check() {
  const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  const { count: probCount } = await supabase.from('problems').select('*', { count: 'exact', head: true });
  const { count: volCount } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
  console.log(`Teams: ${teamCount}, Problems: ${probCount}, Volunteers: ${volCount}`);
}

check();
