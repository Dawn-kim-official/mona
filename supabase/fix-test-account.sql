-- 1. 먼저 기존 데이터 확인
SELECT * FROM businesses WHERE user_id = 'e81ef85e-fdba-4646-ac47-872e7d5fde6a';

-- 2. 기존 데이터가 있으면 삭제
DELETE FROM businesses WHERE user_id = 'e81ef85e-fdba-4646-ac47-872e7d5fde6a';

-- 3. 새로 삽입
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
);

-- 4. 확인
SELECT * FROM profiles WHERE email = 'test@test.com';
SELECT * FROM businesses WHERE user_id = 'e81ef85e-fdba-4646-ac47-872e7d5fde6a';