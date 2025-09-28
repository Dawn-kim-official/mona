-- donation_matches 테이블의 RLS 정책 수정
-- 수혜기관이 자신의 매칭을 볼 수 있도록 수정

-- 1. 먼저 기존 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'donation_matches';

-- 2. RLS가 활성화되어 있는지 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'donation_matches';

-- 3. RLS 비활성화 (개발 중 임시)
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 4. 또는 더 나은 방법: 수혜기관을 위한 정책 추가
-- 기존 정책 제거
DROP POLICY IF EXISTS "Beneficiaries can view own matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiaries can update own matches" ON donation_matches;

-- 새로운 정책 추가 (auth.uid()를 직접 사용)
CREATE POLICY "Beneficiaries can view their matches" ON donation_matches
    FOR SELECT 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Beneficiaries can update their matches" ON donation_matches
    FOR UPDATE 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

-- 5. 테스트를 위한 데이터 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status,
    dm.proposed_at,
    b.organization_name,
    b.user_id as beneficiary_user_id,
    d.name as donation_name
FROM donation_matches dm
JOIN beneficiaries b ON b.id = dm.beneficiary_id
JOIN donations d ON d.id = dm.donation_id
ORDER BY dm.created_at DESC;