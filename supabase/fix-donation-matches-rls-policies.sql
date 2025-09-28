-- donation_matches 테이블의 RLS 정책 수정

-- 1. 기존 정책 모두 제거
DROP POLICY IF EXISTS "Admins can do all" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiaries can view own matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiaries can update own matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiaries can view their matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiaries can update their matches" ON donation_matches;

-- 2. RLS 활성화
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 추가
-- 관리자는 모든 작업 가능
CREATE POLICY "Admin full access" ON donation_matches
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 수혜기관은 자신의 매칭 조회 가능
CREATE POLICY "Beneficiary can view own matches" ON donation_matches
    FOR SELECT 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

-- 수혜기관은 자신의 매칭 업데이트 가능
CREATE POLICY "Beneficiary can update own matches" ON donation_matches
    FOR UPDATE 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

-- 4. 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'donation_matches'
ORDER BY policyname;