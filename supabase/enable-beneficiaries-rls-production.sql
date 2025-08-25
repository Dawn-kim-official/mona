-- 프로덕션용 beneficiaries RLS 재활성화

-- 1. RLS 활성화
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- 2. 정책 추가
-- 본인 정보 조회
CREATE POLICY "Users can view own beneficiary profile" ON beneficiaries
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 작업 가능
CREATE POLICY "Admins can do everything" ON beneficiaries
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 신규 수혜자 등록
CREATE POLICY "Anyone can insert beneficiary" ON beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수혜자 본인은 자신의 정보 업데이트 가능 (상태 제외)
CREATE POLICY "Beneficiaries can update own profile" ON beneficiaries
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = (SELECT status FROM beneficiaries WHERE id = beneficiaries.id));

-- 3. 확인
SELECT 
  tablename,
  policyname,
  cmd 
FROM pg_policies 
WHERE tablename = 'beneficiaries';