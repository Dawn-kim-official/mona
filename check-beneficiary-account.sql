-- 방금 가입한 수혜기관 계정 확인

-- 1. auth.users에서 최근 생성된 계정 확인
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 2. profiles 테이블 확인
SELECT 
    p.id,
    p.email,
    p.role,
    p.created_at
FROM profiles p
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. beneficiaries 테이블 확인
SELECT 
    b.id,
    b.user_id,
    b.organization_name,
    b.representative_name,
    b.created_at
FROM beneficiaries b
WHERE b.created_at > NOW() - INTERVAL '1 hour'
ORDER BY b.created_at DESC
LIMIT 5;

-- 4. 특정 이메일로 전체 확인 (이메일 주소를 넣어주세요)
-- SELECT 
--     u.id as user_id,
--     u.email,
--     u.created_at as user_created,
--     p.role,
--     b.id as beneficiary_id,
--     b.organization_name
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id
-- LEFT JOIN beneficiaries b ON u.id = b.user_id
-- WHERE u.email = '가입시도한이메일@example.com';