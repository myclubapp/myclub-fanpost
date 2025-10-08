-- Fix: Korrigiere die fälschlicherweise doppelt hinzugefügten Credits
-- Da der User aktuell 10 Credits hat und ein Reset bereits stattgefunden hat,
-- ist der aktuelle Stand korrekt. Keine Korrektur nötig für den aktuellen Stand.

-- Verbessere consume_credit() Funktion: Prüfe nur für den spezifischen User, ob Reset nötig ist
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  user_role app_role;
  needs_reset BOOLEAN;
  reset_amount INTEGER;
BEGIN
  -- Get current credits and check if reset is needed
  SELECT 
    uc.credits_remaining,
    ur.role,
    uc.last_reset_date < CURRENT_DATE
  INTO current_credits, user_role, needs_reset
  FROM public.user_credits uc
  JOIN public.user_roles ur ON uc.user_id = ur.user_id
  WHERE uc.user_id = p_user_id;

  -- If credits need to be reset, do it only for this user
  IF needs_reset THEN
    -- Determine reset amount based on role
    reset_amount := CASE 
      WHEN user_role = 'free_user' THEN 3
      WHEN user_role = 'paid_user' THEN 10
      WHEN user_role = 'admin' THEN 9999
      ELSE 3
    END;
    
    -- Reset credits
    UPDATE public.user_credits
    SET 
      credits_remaining = reset_amount,
      credits_purchased = 0,
      last_reset_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Log reset transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (
      p_user_id, 
      reset_amount, 
      'monthly_reset', 
      CASE 
        WHEN user_role = 'free_user' THEN 'Free Abo: Credits aufgefüllt +3'
        WHEN user_role = 'paid_user' THEN 'Pro Abo: Credits aufgefüllt +10'
        WHEN user_role = 'admin' THEN 'Admin: Credits aufgefüllt'
        ELSE 'Credits aufgefüllt'
      END
    );
    
    -- Update current_credits variable
    current_credits := reset_amount;
  END IF;

  -- Check if user has credits
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Consume one credit
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - 1,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log consumption transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'consumption', 'Credit verbraucht');

  RETURN TRUE;
END;
$$;