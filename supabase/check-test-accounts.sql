-- 테스트 계정 확인

-- 1. 모든 beneficiary 사용자 확인
SELECT 
    u.id as user_id,
    u.email,
    b.id as beneficiary_id,
    b.organization_name,
    b.status as beneficiary_status
FROM auth.users u
JOIN beneficiaries b ON b.user_id = u.id
ORDER BY b.organization_name;

-- 2. estar 관련 계정 확인
SELECT 
    u.id as user_id,
    u.email,
    b.id as beneficiary_id,
    b.organization_name,
    b.status
FROM auth.users u
JOIN beneficiaries b ON b.user_id = u.id
WHERE u.email LIKE '%estar%' 
   OR u.email LIKE '%test%'
   OR b.organization_name LIKE '%이스타%'
   OR b.organization_name LIKE '%estar%';

-- 3. 매칭이 있는 수혜기관의 이메일 확인
SELECT DISTINCT
    b.organization_name,
    u.email,
    COUNT(dm.id) as match_count
FROM beneficiaries b
JOIN auth.users u ON u.id = b.user_id
LEFT JOIN donation_matches dm ON dm.beneficiary_id = b.id
WHERE dm.id IS NOT NULL
GROUP BY b.organization_name, u.email
ORDER BY match_count DESC;