-- Drop existing policy if it exists to recreate it correctly
DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;

-- Create storage policy for uploading logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-logos' 
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);