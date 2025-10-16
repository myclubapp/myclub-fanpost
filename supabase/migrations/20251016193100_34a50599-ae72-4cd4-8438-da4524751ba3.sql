-- Secure subscription_limits table
-- Only readable by the app, but not writable from external sources
-- Changes can only be made through Supabase Admin UI

-- Enable RLS on subscription_limits table
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read subscription limits
-- This is needed for the app to check subscription features
CREATE POLICY "Authenticated users can view subscription limits"
ON public.subscription_limits
FOR SELECT
TO authenticated
USING (true);

-- No INSERT, UPDATE, or DELETE policies are created
-- This means only Supabase Admin UI (with service role) can modify the data