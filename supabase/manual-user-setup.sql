-- 1. 먼저 생성된 사용자의 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test@business.com';

-- 2. 위에서 확인한 user_id를 사용하여 profile 생성
-- (아래 'USER_ID_HERE'를 실제 ID로 교체)
INSERT INTO profiles (id, email, role)
VALUES ('USER_ID_HERE', 'test@business.com', 'business')
ON CONFLICT (id) DO NOTHING;

-- 3. 관리자 계정 생성 (같은 방법으로)
-- 먼저 admin@monaimpact.com 사용자를 Dashboard에서 생성
-- 그 다음 아래 SQL 실행
INSERT INTO profiles (id, email, role)
VALUES ('ADMIN_USER_ID_HERE', 'admin@monaimpact.com', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 4. 확인
SELECT * FROM profiles;