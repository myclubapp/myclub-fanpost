-- Remove automatic credit resets from consume_credit function
-- Credits should ONLY be refilled through Stripe subscription renewals via check-subscription edge function

-- Simplified consume_credit function: Only consumes credits, NO automatic resets
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
BEGIN
  -- Lock the row and read current credits to avoid concurrent writes
  SELECT uc.credits_remaining
    INTO current_credits
  FROM public.user_credits uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;

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

-- Drop the reset_monthly_credits function as it's no longer needed
-- All credit refills are now handled by the check-subscription edge function based on Stripe subscription renewals
DROP FUNCTION IF EXISTS public.reset_monthly_credits();