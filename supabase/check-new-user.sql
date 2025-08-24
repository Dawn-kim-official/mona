-- 새로 가입한 사용자 확인

-- 1. 최근 가입한 사용자 확인
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '이메일 미확인'
        ELSE '이메일 확인됨'
    END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. 이메일 확인이 안 된 사용자들 자동 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. 프로필과 비즈니스 정보 확인
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role,
    b.name as business_name,
    b.status as business_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. 결과 메시지
SELECT '이메일 확인이 완료되었습니다. 이제 로그인할 수 있습니다.' as message;