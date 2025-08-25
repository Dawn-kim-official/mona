-- Create admin account
-- Run this SQL after creating a user account through Supabase Auth

-- First, create an admin account via Supabase Auth with:
-- Email: admin@mona.co.kr
-- Password: admin123!

-- Then update the profile to have admin role
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@mona.co.kr';

-- Verify the admin account
SELECT id, email, role FROM profiles WHERE email = 'admin@mona.co.kr';