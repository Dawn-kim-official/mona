-- donation_matches 테이블의 RLS 임시 비활성화
-- 개발 중 문제 해결을 위해 임시로 비활성화

-- 1. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'donation_matches';

-- 2. RLS 비활성화
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 3. 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'donation_matches';

-- 4. 데이터 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status,
    dm.proposed_at,
    b.organization_name,
    b.user_id as beneficiary_user_id,
    d.name as donation_name,
    d.description as donation_description
FROM donation_matches dm
JOIN beneficiaries b ON b.id = dm.beneficiary_id
JOIN donations d ON d.id = dm.donation_id
ORDER BY dm.created_at DESC;