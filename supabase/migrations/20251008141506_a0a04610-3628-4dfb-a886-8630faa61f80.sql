-- Ändere Template-Struktur: Entferne template_type, füge supported_games hinzu
ALTER TABLE templates DROP COLUMN IF EXISTS template_type;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS supported_games INTEGER NOT NULL DEFAULT 1 CHECK (supported_games >= 1 AND supported_games <= 3);