-- Simple storage bucket creation
-- Run this in Supabase SQL Editor

-- Create donation_photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-photos', 
  'donation-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Note: After creating the bucket, go to Supabase Dashboard:
-- 1. Navigate to Storage
-- 2. Click on 'donation-photos' bucket
-- 3. You can either:
--    a) Disable RLS by toggling "RLS enabled" to OFF (easiest for development)
--    b) Or create policies through the UI