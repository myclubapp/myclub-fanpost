-- Add announcement_days_before column to profiles table
ALTER TABLE public.profiles
ADD COLUMN announcement_days_before integer NOT NULL DEFAULT 3;