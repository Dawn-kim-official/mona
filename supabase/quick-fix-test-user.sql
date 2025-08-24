-- test@test.com 사용자에 비즈니스 정보 추가하여 로그인 가능하게 만들기

-- 비즈니스 정보가 없으면 생성, 있으면 업데이트
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
  '테스트 회사' as name,
  '김테스트' as representative_name,
  'https://example.com/license.pdf' as business_license_url,
  'test@test.com' as email,
  '010-1234-5678' as phone,
  '123-45-67890' as address,
  'https://testcompany.com' as website,
  'approved' as status,
  true as contract_signed,
  NOW() as approved_at
FROM auth.users 
WHERE email = 'test@test.com'
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'approved',
  contract_signed = true,
  approved_at = NOW();

-- 결과 확인
SELECT 
  u.email,
  b.name as business_name,
  b.status,
  b.approved_at
FROM auth.users u
JOIN businesses b ON u.id = b.user_id
WHERE u.email = 'test@test.com';