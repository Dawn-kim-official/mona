-- 1. test@test.com 사용자의 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test@test.com';

-- 2. 위에서 확인한 ID를 복사해서 아래 'USER_ID_HERE'를 모두 교체하세요

-- 3. Profile 생성 (비즈니스 사용자로)
INSERT INTO profiles (id, email, role)
VALUES ('e81ef85e-fdba-4646-ac47-872e7d5fde6a', 'test@test.com', 'business')
ON CONFLICT (id) DO UPDATE SET role = 'business';

-- 4. 비즈니스 생성 (승인된 상태로)
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
  'e81ef85e-fdba-4646-ac47-872e7d5fde6a',
  '테스트 회사',
  '테스트 대표',
  'https://example.com/license.pdf',
  'test@test.com',
  '010-1111-2222',
  '서울시 강남구 테스트로 123',
  'https://test.com',
  'approved',
  true,
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 5. 확인
SELECT * FROM profiles WHERE email = 'test@test.com';
SELECT * FROM businesses WHERE email = 'test@test.com';