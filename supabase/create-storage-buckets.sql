-- Create storage buckets for donation photos
-- Run this in Supabase SQL Editor

-- Create donation_photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-photos', 'donation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Enable public access for donation photos
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'donation-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'donation-photos');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'donation-photos')
WITH CHECK (bucket_id = 'donation-photos');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'donation-photos');