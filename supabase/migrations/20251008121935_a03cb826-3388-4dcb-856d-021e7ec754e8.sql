-- Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-images',
  'template-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- RLS policies for template images
CREATE POLICY "Paid users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images' 
  AND has_role(auth.uid(), 'paid_user'::app_role)
);

CREATE POLICY "Paid users can update their template images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'template-images'
  AND has_role(auth.uid(), 'paid_user'::app_role)
);

CREATE POLICY "Paid users can delete their template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images'
  AND has_role(auth.uid(), 'paid_user'::app_role)
);

CREATE POLICY "Anyone can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');