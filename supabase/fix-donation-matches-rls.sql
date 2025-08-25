-- donation_matches 테이블의 RLS 정책 수정

-- 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'donation_matches';

-- RLS 활성화 (이미 활성화되어 있을 수 있음)
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- 관리자가 donation_matches를 생성할 수 있도록 허용
CREATE POLICY "Admins can create donation matches"
ON donation_matches
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 관리자가 donation_matches를 업데이트할 수 있도록 허용
CREATE POLICY "Admins can update donation matches"
ON donation_matches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 모든 인증된 사용자가 donation_matches를 읽을 수 있도록 허용
CREATE POLICY "Authenticated users can view donation matches"
ON donation_matches
FOR SELECT
TO authenticated
USING (true);

-- 수혜기관이 자신과 관련된 매치를 볼 수 있도록 허용
CREATE POLICY "Beneficiaries can view their matches"
ON donation_matches
FOR SELECT
TO authenticated
USING (
  beneficiary_id IN (
    SELECT id FROM beneficiaries
    WHERE user_id = auth.uid()
  )
);