const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Initializing CREATEX Arena Tables...');

  // Note: Supabase JS SDK doesn't support 'CREATE TABLE' directly.
  // We'll use the SQL REST API (if available) or rely on the user to have run a migration.
  // HOWEVER, I can try to use standard PostgreSQL connection if I have the connection string.
  // The user didn't give a DIRECT PG connection string, only Supabase URL.
  // I will assume for now I need to create a script that might use 'supabase.rpc' for SQL if a custom function exists.
  // Actually, I'll just write the SQL schema to a file so the user can see it/I can try to run it.
}

// SQL Schema for manual or automated execution
const schemaSql = `
-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY, -- CREATOR-XXX
  name TEXT NOT NULL,
  leader_reg TEXT NOT NULL,
  cluster TEXT NOT NULL, -- A, B, C
  members JSONB DEFAULT '[]'::jsonb,
  problem_id TEXT,
  ppt_status TEXT DEFAULT 'Not Uploaded', -- Uploaded, Verified
  attendance_status TEXT DEFAULT 'Absent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Problem Statements Table
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY, -- P01, P02...
  title TEXT NOT NULL,
  description TEXT,
  selected_by TEXT REFERENCES teams(id),
  selected_cluster TEXT,
  is_revealed BOOLEAN DEFAULT FALSE,
  is_details_revealed BOOLEAN DEFAULT FALSE,
  selection_start_time TIMESTAMPTZ
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  member_reg TEXT NOT NULL,
  session_id TEXT NOT NULL, -- Session 1, Session 2...
  status TEXT DEFAULT 'Present',
  marked_by TEXT, -- Volunteer ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  reviewer_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  marks JSONB NOT NULL, -- { understanding: 10, creativity: 10, ... }
  total_score NUMERIC DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  game_name TEXT NOT NULL, -- memory_flip, jigsaw, color_code
  score INTEGER DEFAULT 0,
  time_taken INTEGER, -- in seconds
  moves INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, game_name)
);

-- Memory Wall Table
CREATE TABLE IF NOT EXISTS memory_wall (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY, -- CREATEX_vol_XXX
  name TEXT NOT NULL,
  reg_no TEXT NOT NULL,
  assigned_teams JSONB DEFAULT '[]'::jsonb
);

-- Reviewers Table (for custom names)
CREATE TABLE IF NOT EXISTS reviewers (
  id TEXT PRIMARY KEY, -- reviewer_1
  display_name TEXT,
  assigned_teams JSONB DEFAULT '[]'::jsonb
);

-- Global Config Table
CREATE TABLE IF NOT EXISTS global_config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Initialize Config
INSERT INTO global_config (key, value) VALUES ('problem_selection_state', '{"countdown": 3600, "revealed": false, "enabled": false}') ON CONFLICT DO NOTHING;
INSERT INTO global_config (key, value) VALUES ('active_rounds', '{"r1": false, "r2": false, "r3": false}') ON CONFLICT DO NOTHING;
INSERT INTO global_config (key, value) VALUES ('active_attendance_session', '"Session 1"') ON CONFLICT DO NOTHING;
INSERT INTO global_config (key, value) VALUES ('game_zone_unlocked', 'false') ON CONFLICT DO NOTHING;
`;

module.exports = { schemaSql };
