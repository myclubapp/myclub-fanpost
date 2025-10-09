-- Add instagram_username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_username text;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.instagram_username IS 'Instagram username without @ symbol';
