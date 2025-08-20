-- 테스트 사용자 생성을 위한 SQL
-- 주의: 이 방법은 개발 환경에서만 사용하세요

-- 1. 비즈니스 사용자 생성
-- Supabase Dashboard > Authentication > Users에서 수동으로 생성하거나
-- 회원가입 페이지를 통해 생성하세요

-- 2. 생성된 사용자를 관리자로 변경 (사용자 생성 후 실행)
-- admin@monaimpact.com 으로 회원가입한 후 아래 SQL 실행
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@monaimpact.com';

-- 3. 테스트 비즈니스 데이터 생성 (선택사항)
-- 먼저 test@business.com으로 회원가입 후 user_id를 확인하고 실행
-- INSERT INTO businesses (
--   user_id,
--   name,
--   representative_name,
--   business_license_url,
--   email,
--   phone,
--   address,
--   status,
--   contract_signed
-- ) VALUES (
--   'USER_ID_HERE', -- 실제 user_id로 변경
--   '테스트 기업',
--   '홍길동',
--   'https://example.com/license.pdf',
--   'test@business.com',
--   '010-1234-5678',
--   '서울시 강남구 테스트로 123',
--   'approved',
--   true
-- );