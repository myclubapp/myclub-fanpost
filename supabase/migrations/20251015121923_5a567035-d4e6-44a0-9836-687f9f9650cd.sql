-- Update the can_change_team_slot function to check for 7 days (1 week) instead of 30 days
CREATE OR REPLACE FUNCTION public.can_change_team_slot(p_user_id uuid, p_team_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  last_change TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_changed_at INTO last_change
  FROM public.user_team_slots
  WHERE user_id = p_user_id AND team_id = p_team_id;
  
  -- If no record exists, change is allowed
  IF last_change IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if at least 7 days have passed (1 week)
  RETURN last_change < NOW() - INTERVAL '7 days';
END;
$$;