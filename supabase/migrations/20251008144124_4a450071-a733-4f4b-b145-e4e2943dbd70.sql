-- Add columns to profiles table for remembering last wizard selection
ALTER TABLE public.profiles
ADD COLUMN remember_last_selection boolean DEFAULT true,
ADD COLUMN last_club_id text,
ADD COLUMN last_team_id text;