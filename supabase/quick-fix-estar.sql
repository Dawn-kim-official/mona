-- estar1996@naver.com 사용자 빠른 수정

-- 1. 프로필 생성/업데이트
INSERT INTO profiles (id, email, role)
SELECT id, email, 'business'
FROM auth.users 
WHERE email = 'estar1996@naver.com'
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 2. 비즈니스 정보 생성/업데이트 (승인 상태로)
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
  'Estar 회사' as name,
  'Estar' as representative_name,
  'https://example.com/license.pdf' as business_license_url,
  'estar1996@naver.com' as email,
  '010-1996-0000' as phone,
  '123-45-67890' as address,
  'https://estar.com' as website,
  'approved' as status,
  true as contract_signed,
  NOW() as approved_at
FROM auth.users 
WHERE email = 'estar1996@naver.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'approved',
  contract_signed = true,
  approved_at = NOW();

-- 3. 결과 확인
SELECT 
  u.email,
  p.role,
  b.name as business_name,
  b.status,
  b.approved_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
WHERE u.email = 'estar1996@naver.com';