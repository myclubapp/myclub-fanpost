-- Create enum for transaction types
CREATE TYPE credit_transaction_type AS ENUM (
  'monthly_reset',
  'purchase',
  'consumption',
  'subscription_grant'
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type credit_transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);

-- Update consume_credit function to log transactions
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
BEGIN
  -- First check if credits need to be reset
  PERFORM public.reset_monthly_credits();
  
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;

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

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -1, 'consumption', 'Credit verbraucht');

  RETURN TRUE;
END;
$function$;

-- Update add_purchased_credits function to log transactions
CREATE OR REPLACE FUNCTION public.add_purchased_credits(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_credits
  SET 
    credits_purchased = credits_purchased + p_amount,
    credits_remaining = credits_remaining + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'purchase', 'Credits gekauft');
END;
$function$;

-- Update reset_monthly_credits function to log transactions
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

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (reset_record.user_id, 3, 'monthly_reset', 'Monatliche Credits (Free)');
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

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (reset_record.user_id, 10, 'monthly_reset', 'Monatliche Credits (Pro)');
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
    VALUES (reset_record.user_id, 9999, 'monthly_reset', 'Monatliche Credits (Admin)');
  END LOOP;
END;
$function$;