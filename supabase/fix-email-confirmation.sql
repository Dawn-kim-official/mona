-- 이메일 확인 문제 해결

-- 1. 현재 미확인 사용자 확인
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. email_confirmed_at만 업데이트
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. 업데이트 후 확인
SELECT 
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ 확인됨'
        ELSE '❌ 미확인'
    END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. 만약 여전히 로그인이 안 된다면, 비밀번호 리셋
-- 아래 이메일을 실제 사용자 이메일로 변경하세요
/*
UPDATE auth.users 
SET encrypted_password = crypt('123123', gen_salt('bf'))
WHERE email = 'your-email@example.com';
*/