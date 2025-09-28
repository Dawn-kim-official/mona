-- donation_matches 테이블의 중복된 RLS 정책 정리

-- 1. 모든 기존 정책 제거
DROP POLICY IF EXISTS "Admin full access" ON donation_matches;
DROP POLICY IF EXISTS "Admins can create donation matches" ON donation_matches;
DROP POLICY IF EXISTS "Admins can update donation matches" ON donation_matches;
DROP POLICY IF EXISTS "Authenticated users can view donation matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiary can update own matches" ON donation_matches;
DROP POLICY IF EXISTS "Beneficiary can view own matches" ON donation_matches;

-- 2. 깔끔한 정책 재생성
-- 관리자는 모든 작업 가능
CREATE POLICY "Admin can do all operations" ON donation_matches
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 수혜기관은 자신의 매칭 조회 가능
CREATE POLICY "Beneficiary can view their matches" ON donation_matches
    FOR SELECT 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

-- 수혜기관은 자신의 매칭 업데이트 가능 (status, response_notes 등)
CREATE POLICY "Beneficiary can update their matches" ON donation_matches
    FOR UPDATE 
    USING (
        beneficiary_id IN (
            SELECT id FROM beneficiaries 
            WHERE user_id = auth.uid()
        )
    );

-- 3. 정책 확인
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'donation_matches'
ORDER BY policyname;

-- 4. 데이터 확인
SELECT COUNT(*) as total_matches FROM donation_matches;