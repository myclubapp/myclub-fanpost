-- Add columns to credit_transactions for storing game context and template info
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS game_url TEXT,
ADD COLUMN IF NOT EXISTS template_info TEXT;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.credit_transactions.game_url IS 'URL to the game/team/club that was used when the credit was consumed';
COMMENT ON COLUMN public.credit_transactions.template_info IS 'Theme name or custom template ID that was used';