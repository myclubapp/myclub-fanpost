-- Concurrency-safe monthly reset and credit consumption
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  user_role app_role;
  reset_amount INTEGER;
BEGIN
  -- Determine user role
  SELECT ur.role
    INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Determine reset amount based on role
  reset_amount := CASE 
    WHEN user_role = 'free_user' THEN 3
    WHEN user_role = 'paid_user' THEN 10
    WHEN user_role = 'admin' THEN 9999
    ELSE 3
  END;

  -- Try to perform a monthly reset atomically (prevents race conditions)
  UPDATE public.user_credits uc
  SET 
    credits_remaining = reset_amount,
    credits_purchased = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = now()
  WHERE uc.user_id = p_user_id
    AND uc.last_reset_date < CURRENT_DATE;

  IF FOUND THEN
    -- Reset happened just now; log a single monthly_reset transaction
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

    -- current_credits is reset_amount after reset
    current_credits := reset_amount;
  ELSE
    -- No reset this call; lock the row and read current credits to avoid concurrent writes
    SELECT uc.credits_remaining
      INTO current_credits
    FROM public.user_credits uc
    WHERE uc.user_id = p_user_id
    FOR UPDATE;
  END IF;

  -- If still no credits, abort
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Consume one credit
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - 1,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log consumption
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'consumption', 'Credit verbraucht');

  RETURN TRUE;
END;
$$;