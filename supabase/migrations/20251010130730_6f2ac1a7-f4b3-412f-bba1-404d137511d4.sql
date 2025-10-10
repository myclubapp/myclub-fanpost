-- Add monthly credit reset for Free Users only
-- Paid users get credits ONLY through Stripe subscription renewals
-- Free users get 3 credits monthly based on last_reset_date

CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id uuid,
  p_game_url text DEFAULT NULL,
  p_template_info text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  user_role app_role;
  reset_amount INTEGER := 3; -- Free users always get 3 credits
BEGIN
  -- Get user role
  SELECT ur.role
    INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Only perform monthly reset for FREE USERS
  -- Paid users get credits through Stripe subscription renewals in check-subscription
  IF user_role = 'free_user' THEN
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
        'Free Abo: Credits aufgefüllt +3'
      );

      -- current_credits is reset_amount after reset
      current_credits := reset_amount;
    ELSE
      -- No reset this call; lock the row and read current credits
      SELECT uc.credits_remaining
        INTO current_credits
      FROM public.user_credits uc
      WHERE uc.user_id = p_user_id
      FOR UPDATE;
    END IF;
  ELSE
    -- For paid users and admins: no automatic reset, just read credits
    SELECT uc.credits_remaining
      INTO current_credits
    FROM public.user_credits uc
    WHERE uc.user_id = p_user_id
    FOR UPDATE;
  END IF;

  -- If no credits available, abort
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Consume one credit
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - 1,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log consumption with game_url and template_info
  INSERT INTO public.credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    description,
    game_url,
    template_info
  )
  VALUES (
    p_user_id, 
    -1, 
    'consumption', 
    'Credit verbraucht',
    p_game_url,
    p_template_info
  );

  RETURN TRUE;
END;
$$;