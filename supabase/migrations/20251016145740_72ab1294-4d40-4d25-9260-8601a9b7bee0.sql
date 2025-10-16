-- Drop the existing check constraint
ALTER TABLE user_logos DROP CONSTRAINT IF EXISTS user_logos_logo_type_check;

-- Add the updated check constraint with 'other' included
ALTER TABLE user_logos ADD CONSTRAINT user_logos_logo_type_check 
CHECK (logo_type IN ('sponsor', 'club', 'team', 'other'));