-- 테스트 수혜자 계정 생성 (간단한 버전)

-- 1. 먼저 기존 테스트 계정이 있는지 확인
SELECT * FROM auth.users WHERE email = 'beneficiary1@test.com';

-- 2. 없다면 새로 생성
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'beneficiary1@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  NOW()
);

-- 3. 생성된 사용자 정보로 profiles 추가
INSERT INTO profiles (id, email, role)
SELECT id, email, 'beneficiary'
FROM auth.users 
WHERE email = 'beneficiary1@test.com';

-- 4. beneficiaries 테이블에 추가
INSERT INTO beneficiaries (
  user_id,
  organization_name,
  organization_type,
  representative_name,
  email,
  phone,
  address,
  status
)
SELECT 
  id,
  '행복한 복지관',
  '복지관',
  '김복지',
  'contact@welfare.org',
  '010-1234-5678',
  '서울시 강남구 복지로 123',
  'approved'
FROM auth.users 
WHERE email = 'beneficiary1@test.com';

-- 5. 생성 확인
SELECT 
  u.email as user_email,
  p.role,
  b.organization_name,
  b.status
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN beneficiaries b ON u.id = b.user_id
WHERE u.email = 'beneficiary1@test.com';