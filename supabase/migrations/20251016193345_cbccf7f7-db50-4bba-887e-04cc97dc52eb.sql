-- Delete all user data from tables (keep table structure and subscription_limits data)
-- This clears all data for a fresh start after switching from Stripe Sandbox to Production

-- Truncate all user-related tables
-- CASCADE will also delete related records in auth.users
TRUNCATE TABLE public.user_team_slots CASCADE;
TRUNCATE TABLE public.user_subscriptions CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.user_logos CASCADE;
TRUNCATE TABLE public.templates CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Note: subscription_limits table is NOT touched, keeping its configuration data