-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Pro users can insert logos" ON public.user_logos;

-- Create new policy that allows amateur, pro, and premium users to upload logos
CREATE POLICY "Paid users can insert logos" 
ON public.user_logos 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_subscriptions.user_id = auth.uid() 
    AND user_subscriptions.tier IN ('amateur', 'pro', 'premium')
  )
);