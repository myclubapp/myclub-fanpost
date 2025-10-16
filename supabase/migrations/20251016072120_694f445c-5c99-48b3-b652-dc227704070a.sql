-- Create storage bucket for game background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-backgrounds', 'game-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own background images
CREATE POLICY "Users can upload background images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds'
);

-- Allow authenticated users to update their own background images
CREATE POLICY "Users can update their background images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'game-backgrounds' AND
  (storage.foldername(name))[1] = 'backgrounds'
);

-- Allow public read access to background images
CREATE POLICY "Public can view background images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'game-backgrounds');