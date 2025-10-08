-- Create user_credits table to track monthly credits
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 3,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining, last_reset_date)
  VALUES (NEW.id, 3, CURRENT_DATE);
  RETURN NEW;
END;
$$;

-- Trigger to initialize credits when user is created
CREATE TRIGGER on_user_created_initialize_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Reset credits for free users (3 credits)
  UPDATE public.user_credits uc
  SET 
    credits_remaining = 3,
    credits_purchased = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = now()
  FROM public.user_roles ur
  WHERE uc.user_id = ur.user_id
    AND ur.role = 'free_user'
    AND uc.last_reset_date < CURRENT_DATE;

  -- Reset credits for paid users (10 credits)
  UPDATE public.user_credits uc
  SET 
    credits_remaining = 10,
    credits_purchased = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = now()
  FROM public.user_roles ur
  WHERE uc.user_id = ur.user_id
    AND ur.role = 'paid_user'
    AND uc.last_reset_date < CURRENT_DATE;

  -- Reset credits for admin users (unlimited = 9999)
  UPDATE public.user_credits uc
  SET 
    credits_remaining = 9999,
    credits_purchased = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = now()
  FROM public.user_roles ur
  WHERE uc.user_id = ur.user_id
    AND ur.role = 'admin'
    AND uc.last_reset_date < CURRENT_DATE;
END;
$$;

-- Function to consume a credit
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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

  RETURN TRUE;
END;
$$;

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION public.add_purchased_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_credits
  SET 
    credits_purchased = credits_purchased + p_amount,
    credits_remaining = credits_remaining + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();