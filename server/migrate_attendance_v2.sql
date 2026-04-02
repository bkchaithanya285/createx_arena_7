-- Migration Script: Multi-Session Attendance System
-- Run this in your Supabase SQL Editor

-- 1. Create Attendance Sessions Table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id SERIAL PRIMARY KEY,
  session_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Rebuilt Attendance Table (v2)
-- Using a new table to avoid breaking old statistics while switching
CREATE TABLE IF NOT EXISTS attendance_v2 (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  member_id TEXT NOT NULL, -- registration number
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Present',
  session_id INTEGER REFERENCES attendance_sessions(id),
  scanned_by TEXT, -- volunteer ID
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, session_id)
);

-- 3. Add Index for performance
CREATE INDEX IF NOT EXISTS attendance_v2_session_idx ON attendance_v2(session_id);
CREATE INDEX IF NOT EXISTS attendance_v2_team_idx ON attendance_v2(team_id);

-- 4. Set initial active session key in global_config if not exists
INSERT INTO global_config (key, value) VALUES ('attendance_v2_active_id', 'null') ON CONFLICT DO NOTHING;
