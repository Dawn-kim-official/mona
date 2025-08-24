-- 모든 미확인 사용자 이메일 확인 처리

-- 1. 미확인 사용자 확인
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ 미확인'
        ELSE '✅ 확인됨'
    END as status
FROM auth.users
WHERE email_confirmed_at IS NULL;

-- 2. 모든 사용자 이메일 확인 처리
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 3. 결과 확인
SELECT 
    email,
    email_confirmed_at,
    '✅ 이메일 확인 완료' as status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;