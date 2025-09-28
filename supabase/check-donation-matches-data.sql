-- donation_matches 테이블의 데이터 확인

-- 1. donation_matches 테이블의 모든 데이터 확인
SELECT 
    dm.*,
    d.name as donation_name,
    d.description as donation_description,
    b.organization_name as beneficiary_name
FROM donation_matches dm
LEFT JOIN donations d ON d.id = dm.donation_id
LEFT JOIN beneficiaries b ON b.id = dm.beneficiary_id
ORDER BY dm.created_at DESC;

-- 2. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'donation_matches'
ORDER BY policyname;

-- 3. 특정 수혜기관의 매칭 확인 (테스트용)
SELECT 
    dm.*,
    d.name as donation_name,
    b.organization_name
FROM donation_matches dm
JOIN donations d ON d.id = dm.donation_id
JOIN beneficiaries b ON b.id = dm.beneficiary_id
WHERE b.organization_name LIKE '%이스타%'
   OR b.organization_name LIKE '%estar%'
   OR b.organization_name LIKE '%ESTAR%';

-- 4. beneficiaries 테이블 확인
SELECT 
    id,
    organization_name,
    user_id,
    status
FROM beneficiaries
ORDER BY created_at DESC;