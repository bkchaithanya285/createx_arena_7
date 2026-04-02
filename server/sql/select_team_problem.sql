-- select_team_problem.sql
-- Atomic problem selection script for CreateX Arena
-- Copy and run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION select_team_problem(
  p_id TEXT, 
  t_cluster INT, 
  t_id TEXT
) RETURNS JSON AS $$
DECLARE
  p_count INT;
  c_count INT;
  existing_p TEXT;
BEGIN
  -- 1. Check if problem is full (max 3 globally)
  SELECT COUNT(*) INTO p_count FROM teams WHERE problem_id = p_id;
  IF p_count >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'PROBLEM_FULL');
  END IF;

  -- 2. Check if cluster already has this problem (max 1 per cluster)
  SELECT COUNT(*) INTO c_count FROM teams WHERE problem_id = p_id AND cluster = t_cluster;
  IF c_count >= 1 THEN
    RETURN json_build_object('success', false, 'error', 'CLUSTER_COLLISION');
  END IF;

  -- 3. Check if team already has a problem
  SELECT problem_id INTO existing_p FROM teams WHERE id = t_id;
  IF existing_p IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'ALREADY_SELECTED', 'current', existing_p);
  END IF;

  -- 4. Atomic Update
  UPDATE teams 
  SET problem_id = p_id 
  WHERE id = t_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
