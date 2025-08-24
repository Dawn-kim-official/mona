-- 회원가입 문제 해결 SQL

-- 1. RLS 완전 비활성화 (개발용)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 2. 스토리지 정책 모두 삭제
DROP POLICY IF EXISTS "Business owners can upload own license" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can view own license" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all licenses" ON storage.objects;
DROP POLICY IF EXISTS "Business can upload donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Business can update own donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Business can delete own donation photos" ON storage.objects;

-- 3. estar1996@naver.com 사용자 프로필 생성
INSERT INTO profiles (id, email, role)
SELECT id, email, 'business'
FROM auth.users 
WHERE email = 'estar1996@naver.com'
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 4. 비즈니스 정보도 미리 생성 (승인 상태)
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

-- 5. 결과 확인
SELECT 
  u.email,
  p.role,
  b.name as business_name,
  b.status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
WHERE u.email = 'estar1996@naver.com';