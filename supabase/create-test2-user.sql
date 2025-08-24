-- test2@test.com 계정 생성 및 설정

-- 1. 먼저 Supabase Dashboard > Authentication > Users에서 수동으로 생성하거나
-- 아래 명령을 사용 (Dashboard에서 하는 것이 더 쉬움):
-- Email: test2@test.com
-- Password: 123123

-- 2. 사용자가 생성된 후, 아래 SQL을 실행하여 프로필과 비즈니스 정보 추가

-- 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'test2@test.com';

-- 프로필 생성 (사용자가 이미 존재하는 경우)
INSERT INTO profiles (id, email, role)
SELECT id, email, 'business'
FROM auth.users 
WHERE email = 'test2@test.com'
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 비즈니스 정보 생성
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
) 
SELECT 
  id as user_id,
  '테스트 회사 2' as name,
  '이테스트' as representative_name,
  'https://example.com/license2.pdf' as business_license_url,
  'contact@testcompany2.com' as email,
  '010-2222-3333' as phone,
  '234-56-78901' as address, -- 사업자 등록번호
  'https://testcompany2.com' as website,
  'approved' as status,
  true as contract_signed,
  NOW() as approved_at
FROM auth.users 
WHERE email = 'test2@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'approved',
  approved_at = NOW();

-- 확인
SELECT 
  u.email as user_email,
  p.role,
  b.*
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
WHERE u.email = 'test2@test.com';