-- Remove credit system completely

-- Drop triggers on auth.users table first
DROP TRIGGER IF EXISTS on_user_created_initialize_credits ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;

-- Now drop database functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.consume_credit(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.consume_credit(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.add_purchased_credits(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_credits() CASCADE;

-- Drop tables (transactions first due to potential dependencies)
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;

-- Drop enum type for transaction types
DROP TYPE IF EXISTS public.credit_transaction_type CASCADE;