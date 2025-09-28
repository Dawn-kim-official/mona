-- donation_matches 디버깅

-- 1. 모든 donation_matches 데이터 확인
SELECT 
    dm.*,
    d.name as donation_name,
    d.description as donation_desc,
    d.status as donation_status,
    b.organization_name,
    b.user_id as beneficiary_user_id
FROM donation_matches dm
LEFT JOIN donations d ON d.id = dm.donation_id
LEFT JOIN beneficiaries b ON b.id = dm.beneficiary_id
ORDER BY dm.created_at DESC;

-- 2. beneficiaries 테이블 확인
SELECT 
    id,
    organization_name,
    user_id,
    status,
    created_at
FROM beneficiaries
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 3. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('donation_matches', 'beneficiaries')
ORDER BY tablename, policyname;

-- 4. 테이블의 RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('donation_matches', 'beneficiaries', 'donations')
ORDER BY tablename;