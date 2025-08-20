-- 1. 먼저 Supabase Dashboard > Authentication > Users에서 다음 계정들을 생성하세요:
-- 
-- 비즈니스 계정:
-- Email: test@business.com
-- Password: Test123456!
-- 
-- 관리자 계정:
-- Email: admin@monaimpact.com  
-- Password: Admin123456!

-- 2. 생성된 사용자의 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('test@business.com', 'admin@monaimpact.com');

-- 3. 위에서 확인한 ID를 사용하여 profiles 생성 (ID를 실제 값으로 변경)
-- 비즈니스 사용자 프로필
INSERT INTO profiles (id, email, role)
VALUES ('BUSINESS_USER_ID_HERE', 'test@business.com', 'business')
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 관리자 프로필
INSERT INTO profiles (id, email, role)
VALUES ('ADMIN_USER_ID_HERE', 'admin@monaimpact.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 4. 테스트 비즈니스 생성 (승인된 상태)
INSERT INTO businesses (
  user_id,
  name,
  representative_name,
  business_license_url,
  email,
  phone,
  address,
  status,
  contract_signed,
  approved_at
) VALUES (
  'BUSINESS_USER_ID_HERE', -- 실제 user_id로 변경
  '테스트 기업',
  '홍길동',
  'https://example.com/license.pdf',
  'test@business.com',
  '010-1234-5678',
  '서울시 강남구 테스트로 123',
  'approved',
  true,
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 5. 확인
SELECT * FROM profiles;
SELECT * FROM businesses;