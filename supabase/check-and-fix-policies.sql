-- 1. 현재 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. 기존 정책 삭제 (필요시)
-- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3. 이메일 인증 없이 모든 사용자 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. 테스트: 수혜자 계정 직접 생성
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- auth.users에 사용자 생성
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
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test-beneficiary2@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- profiles에 추가
  INSERT INTO profiles (id, email, role)
  VALUES (new_user_id, 'test-beneficiary2@example.com', 'beneficiary');

  -- beneficiaries에 추가
  INSERT INTO beneficiaries (
    user_id,
    organization_name,
    organization_type,
    representative_name,
    email,
    phone,
    address,
    status
  ) VALUES (
    new_user_id,
    '희망 복지관',
    '복지관',
    '이복지',
    'contact@hope.org',
    '010-2222-3333',
    '서울시 서초구 희망로 456',
    'approved'
  );

  RAISE NOTICE 'Successfully created test beneficiary account: test-beneficiary2@example.com / password123';
END $$;

-- 5. 생성 확인
SELECT 
  u.email,
  p.role,
  b.organization_name,
  b.status
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN beneficiaries b ON u.id = b.user_id
WHERE u.email LIKE 'test-beneficiary%';