-- Drop ALL existing policies for user-logos bucket on storage.objects
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname LIKE '%logo%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create policy for users with logo upload permission to insert into user-logos bucket
CREATE POLICY "Users with upload permission can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM user_subscriptions us
    JOIN subscription_limits sl ON us.tier = sl.tier
    WHERE us.user_id = auth.uid() 
    AND sl.can_upload_logos = true
  )
);

-- Allow users to view their own logos
CREATE POLICY "Users can view their own logos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own logos
CREATE POLICY "Users can update their own logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);