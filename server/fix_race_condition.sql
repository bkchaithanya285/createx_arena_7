-- 1. CLUSTER ISOLATION: Unique constraint (problem_id, cluster)
-- This prevents multiple teams in the same cluster from picking the same problem.
-- We use a partial index to ignore NULL problem_ids (teams who haven't picked yet).
DROP INDEX IF EXISTS unique_problem_per_cluster;
CREATE UNIQUE INDEX unique_problem_per_cluster ON teams (problem_id, cluster) WHERE problem_id IS NOT NULL;

-- 2. ATOMIC SELECTION FUNCTION
-- This handles the "Max 3 teams total" and "1 per cluster" logic in a single transaction.
CREATE OR REPLACE FUNCTION select_team_problem(
    t_id UUID,
    p_id TEXT,
    t_cluster TEXT
) RETURNS JSON AS $$
DECLARE
    occupancy_count INTEGER;
    existing_selection TEXT;
BEGIN
    -- 1. Check if team already has a selection
    SELECT problem_id INTO existing_selection FROM teams WHERE id = t_id;
    IF existing_selection IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'ALREADY_SELECTED', 'current', existing_selection);
    END IF;

    -- 2. Check total occupancy (Max 3)
    SELECT count(*) INTO occupancy_count FROM teams WHERE problem_id = p_id;
    IF occupancy_count >= 3 THEN
        RETURN json_build_object('success', false, 'error', 'PROBLEM_FULL');
    END IF;

    -- 3. Check cluster collision (Already handled by unique index, but good for UX error)
    IF EXISTS (SELECT 1 FROM teams WHERE problem_id = p_id AND cluster = t_cluster) THEN
        RETURN json_build_object('success', false, 'error', 'CLUSTER_COLLISION');
    END IF;

    -- 4. Perform Update
    UPDATE teams SET problem_id = p_id WHERE id = t_id AND problem_id IS NULL;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'SYNC_ERROR');
    END IF;

    RETURN json_build_object('success', true);

EXCEPTION WHEN unique_violation THEN
    -- This catches the case where the cluster check passed but the index blocked it due to a race
    RETURN json_build_object('success', false, 'error', 'RACE_LOST_CLUSTER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
