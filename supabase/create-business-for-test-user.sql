-- test@test.com 사용자를 위한 비즈니스 데이터 생성

-- 1. test@test.com 사용자의 ID 확인
SELECT id, email FROM auth.users WHERE email = 'test@test.com';

-- 2. 비즈니스 데이터 생성 (위에서 확인한 ID를 사용)
INSERT INTO businesses (
  user_id,
  name,
  representative_name,
  business_license_url,
  email,
  phone,
  address,
  website,
  status,
  contract_signed,
  approved_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@test.com'),
  '테스트 회사',
  '김테스트',
  'https://example.com/license.pdf',
  'contact@testcompany.com',
  '010-1234-5678',
  '123-45-67890', -- 사업자 등록번호
  'https://testcompany.com',
  'approved',
  true,
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  status = 'approved',
  approved_at = NOW();

-- 3. 확인
SELECT * FROM businesses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com');