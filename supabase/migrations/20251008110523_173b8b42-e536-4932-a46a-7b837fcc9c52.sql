-- Update the reset_monthly_credits function with better transaction descriptions
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reset_record RECORD;
BEGIN
  -- Reset credits for free users (3 credits)
  FOR reset_record IN
    SELECT uc.user_id, uc.credits_remaining
    FROM public.user_credits uc
    JOIN public.user_roles ur ON uc.user_id = ur.user_id
    WHERE ur.role = 'free_user'
      AND uc.last_reset_date < CURRENT_DATE
  LOOP
    UPDATE public.user_credits
    SET 
      credits_remaining = 3,
      credits_purchased = 0,
      last_reset_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = reset_record.user_id;

    -- Log transaction with new description
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (reset_record.user_id, 3, 'monthly_reset', 'Free Abo: Credits aufgefüllt +3');
  END LOOP;

  -- Reset credits for paid users (10 credits)
  FOR reset_record IN
    SELECT uc.user_id, uc.credits_remaining
    FROM public.user_credits uc
    JOIN public.user_roles ur ON uc.user_id = ur.user_id
    WHERE ur.role = 'paid_user'
      AND uc.last_reset_date < CURRENT_DATE
  LOOP
    UPDATE public.user_credits
    SET 
      credits_remaining = 10,
      credits_purchased = 0,
      last_reset_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = reset_record.user_id;

    -- Log transaction with new description
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (reset_record.user_id, 10, 'monthly_reset', 'Pro Abo: Credits aufgefüllt +10');
  END LOOP;

  -- Reset credits for admin users (unlimited = 9999)
  FOR reset_record IN
    SELECT uc.user_id, uc.credits_remaining
    FROM public.user_credits uc
    JOIN public.user_roles ur ON uc.user_id = ur.user_id
    WHERE ur.role = 'admin'
      AND uc.last_reset_date < CURRENT_DATE
  LOOP
    UPDATE public.user_credits
    SET 
      credits_remaining = 9999,
      credits_purchased = 0,
      last_reset_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = reset_record.user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (reset_record.user_id, 9999, 'monthly_reset', 'Admin: Credits aufgefüllt');
  END LOOP;
END;
$function$;