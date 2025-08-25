-- 바로 사용 가능한 수혜자 계정 생성

-- 1. 기존 테스트 계정 삭제 (있다면)
DELETE FROM beneficiaries WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'beneficiary@test.com'
);
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'beneficiary@test.com'
);
DELETE FROM auth.users WHERE email = 'beneficiary@test.com';

-- 2. 새 계정 생성
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
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'beneficiary@test.com',
  crypt('test123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  ''
);

-- 3. Profile 추가
INSERT INTO profiles (id, email, role)
SELECT id, 'beneficiary@test.com', 'beneficiary'
FROM auth.users 
WHERE email = 'beneficiary@test.com';

-- 4. Beneficiary 정보 추가
INSERT INTO beneficiaries (
  user_id,
  organization_name,
  organization_type,
  representative_name,
  email,
  phone,
  address,
  status,
  approved_at
)
SELECT 
  id,
  '서울 복지재단',
  '복지관',
  '김도움',
  'help@seoul-welfare.org',
  '02-1234-5678',
  '서울시 중구 복지로 100',
  'approved',
  NOW()
FROM auth.users 
WHERE email = 'beneficiary@test.com';

-- 5. 확인
SELECT 
  u.email,
  p.role,
  b.organization_name,
  b.status
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN beneficiaries b ON u.id = b.user_id
WHERE u.email = 'beneficiary@test.com';