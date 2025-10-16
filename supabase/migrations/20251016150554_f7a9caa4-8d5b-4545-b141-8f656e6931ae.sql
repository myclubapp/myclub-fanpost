-- Ensure proper storage policies for game-backgrounds bucket
DROP POLICY IF EXISTS "Users can upload their own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own backgrounds" ON storage.objects;

CREATE POLICY "Users can upload their own backgrounds"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-backgrounds'
  AND (storage.foldername(name))[1] = 'backgrounds'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view their own backgrounds"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'game-backgrounds'
  AND (storage.foldername(name))[1] = 'backgrounds'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update their own backgrounds"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'game-backgrounds'
  AND (storage.foldername(name))[1] = 'backgrounds'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own backgrounds"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'game-backgrounds'
  AND (storage.foldername(name))[1] = 'backgrounds'
  AND (storage.foldername(name))[2] = auth.uid()::text
);