const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const setupDB = async () => {
  console.log('--- Initializing Remaining Tables & Config ---');
  
  try {
    // 1. Global Config (Manual insert since Supabase JS can't create tables)
    // We'll assume the tables exist and just seeding initial values.
    // Wait, let's just make sure the config exists.
    const configs = [
      { key: 'active_session', value: 'Session 1' },
      { key: 'titles_released', value: 'false' },
      { key: 'details_revealed', value: 'false' },
      { key: 'timer_started', value: 'false' },
      { key: 'selection_enabled', value: 'false' }
    ];

    for (const c of configs) {
      await supabase.from('global_config').upsert(c);
    }
    console.log('✓ Global Config Initialized');

    // 2. Games Status for teams
    // Handled via game_scores table.
    
    console.log('--- DB Setup Complete ---');
  } catch (err) {
    console.error('X Setup Failed:', err);
  }
};

setupDB();
