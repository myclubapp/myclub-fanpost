-- Add trigger to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining, last_reset_date)
  VALUES (NEW.id, 3, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_user_created_initialize_credits ON auth.users;

-- Create trigger on auth.users to initialize credits
CREATE TRIGGER on_user_created_initialize_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();

-- Initialize credits for existing users that don't have any
INSERT INTO public.user_credits (user_id, credits_remaining, last_reset_date)
SELECT id, 3, CURRENT_DATE
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_credits);