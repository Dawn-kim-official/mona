-- estar1996@naver.com 사용자 확인 및 생성

-- 1. auth.users에 사용자가 있는지 확인
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'estar1996@naver.com';

-- 2. 프로필이 있는지 확인
SELECT * FROM profiles 
WHERE email = 'estar1996@naver.com';

-- 3. 비즈니스 정보가 있는지 확인  
SELECT * FROM businesses
WHERE email = 'estar1996@naver.com';

-- 4. 사용자가 있다면 프로필 생성/업데이트
INSERT INTO profiles (id, email, role)
SELECT id, email, 'business'
FROM auth.users 
WHERE email = 'estar1996@naver.com'
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 5. 비즈니스 정보 생성 (upsert 대신 조건부 insert)
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
  u.id as user_id,
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
FROM auth.users u
WHERE u.email = 'estar1996@naver.com'
AND NOT EXISTS (
  SELECT 1 FROM businesses b 
  WHERE b.user_id = u.id
);

-- 6. 기존 비즈니스가 있다면 업데이트
UPDATE businesses 
SET 
  status = 'approved',
  contract_signed = true,
  approved_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'estar1996@naver.com'
);

-- 7. 최종 결과 확인
SELECT 
  u.email,
  u.id,
  u.email_confirmed_at,
  p.role,
  b.name as business_name,
  b.status,
  b.approved_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
WHERE u.email = 'estar1996@naver.com';