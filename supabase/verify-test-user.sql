-- 1. auth.users 테이블에서 test@test.com 확인
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'test@test.com';

-- 2. 만약 없다면 다시 생성
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
-- VALUES ('test@test.com', crypt('123123', gen_salt('bf')), now(), 'authenticated');

-- 3. profiles 테이블 확인
SELECT * FROM profiles;