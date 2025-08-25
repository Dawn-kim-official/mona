-- 1. profiles 테이블에 대한 INSERT 정책 확인 및 수정
-- 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 누구나 자신의 프로필을 생성할 수 있도록 정책 추가
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. beneficiaries 테이블의 RLS 정책도 확인
-- 이미 add-beneficiary-tables.sql에서 생성했지만 확인
SELECT * FROM pg_policies WHERE tablename = 'beneficiaries';

-- 3. 이메일 확인 없이 사용자 생성 (개발 환경용)
-- auth.users 테이블의 모든 미확인 사용자를 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. 테스트를 위한 수혜자 계정 직접 생성
-- 먼저 auth.users에 사용자 생성
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test-beneficiary@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 생성된 사용자의 ID 가져오기
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'test-beneficiary@example.com';
  
  -- profiles에 추가
  INSERT INTO profiles (id, email, role)
  VALUES (user_id, 'test-beneficiary@example.com', 'beneficiary')
  ON CONFLICT (id) DO NOTHING;
  
  -- beneficiaries에 추가
  INSERT INTO beneficiaries (user_id, organization_name, organization_type, representative_name, email, phone, address, status)
  VALUES (
    user_id,
    '테스트 복지관',
    '복지관',
    '김복지',
    'test@welfare.org',
    '010-1234-5678',
    '서울시 강남구 테스트로 123',
    'approved'
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;