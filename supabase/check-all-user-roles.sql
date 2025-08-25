-- 모든 사용자와 역할 확인
SELECT 
    au.id,
    au.email,
    p.role,
    p.created_at,
    CASE 
        WHEN p.role = 'business' THEN b.name
        WHEN p.role = 'beneficiary' THEN ben.organization_name
        ELSE NULL
    END as organization_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN businesses b ON au.id = b.user_id
LEFT JOIN beneficiaries ben ON au.id = ben.user_id
ORDER BY p.created_at DESC;

-- 역할별 사용자 수 확인
SELECT 
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role;

-- 수혜기관 목록
SELECT 
    ben.id,
    ben.organization_name,
    ben.representative_name,
    au.email,
    ben.created_at
FROM beneficiaries ben
JOIN auth.users au ON ben.user_id = au.id
ORDER BY ben.created_at DESC;

-- 기업 목록
SELECT 
    b.id,
    b.name,
    b.representative_name,
    au.email,
    b.created_at
FROM businesses b
JOIN auth.users au ON b.user_id = au.id
ORDER BY b.created_at DESC;
