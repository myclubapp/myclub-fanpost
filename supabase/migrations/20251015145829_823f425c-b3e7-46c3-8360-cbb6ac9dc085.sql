-- Drop the hardcoded policy
DROP POLICY IF EXISTS "Paid users can insert logos" ON public.user_logos;

-- Create policy that checks subscription_limits table
CREATE POLICY "Users with logo upload permission can insert logos" 
ON public.user_logos 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1
    FROM user_subscriptions us
    JOIN subscription_limits sl ON us.tier = sl.tier
    WHERE us.user_id = auth.uid() 
    AND sl.can_upload_logos = true
  )
);