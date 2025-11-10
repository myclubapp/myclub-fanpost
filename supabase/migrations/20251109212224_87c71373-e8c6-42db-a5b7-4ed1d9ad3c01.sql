-- Füge E-Mail-Präferenzen zur profiles-Tabelle hinzu
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_game_day_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_game_announcement_reminder BOOLEAN DEFAULT true;

-- Kommentar für die neuen Spalten
COMMENT ON COLUMN public.profiles.email_game_day_reminder IS 'Erhält E-Mail-Reminder für Spiele am aktuellen Tag (Standard: aktiviert)';
COMMENT ON COLUMN public.profiles.email_game_announcement_reminder IS 'Erhält E-Mail-Reminder 3 Tage vor Spielen (Standard: aktiviert)';