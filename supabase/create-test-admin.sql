-- 테스트용 어드민 계정 생성
-- 이 SQL은 Supabase Dashboard에서 실행하세요

-- 1. 먼저 auth.users에 어드민 계정을 생성합니다
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  instance_id
) VALUES (
  gen_random_uuid(),
  'admin@mona.com',
  crypt('admin123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (email) DO NOTHING;

-- 2. profiles 테이블에 어드민 권한 설정
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@mona.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. 어드민 계정 확인
SELECT 
  u.email,
  p.role,
  u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@mona.com';

-- 어드민 로그인 정보:
-- 이메일: admin@mona.com
-- 비밀번호: admin123!