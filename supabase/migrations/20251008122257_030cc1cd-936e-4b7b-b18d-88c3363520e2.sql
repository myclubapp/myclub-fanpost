-- Update the template-images bucket to allow 10MB files
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'template-images';