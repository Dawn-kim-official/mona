-- beneficiaries 테이블만 생성

-- 1. 테이블 생성
CREATE TABLE beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(100),
  representative_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  registration_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 추가
CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);

-- 3. RLS 활성화
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- 4. 정책 추가
-- 본인 정보 조회
CREATE POLICY "Users can view own beneficiary profile" ON beneficiaries
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 작업 가능
CREATE POLICY "Enable all for admins" ON beneficiaries
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 신규 수혜자 등록
CREATE POLICY "Anyone can insert beneficiary" ON beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수혜자 본인 업데이트
CREATE POLICY "Beneficiaries can update own profile" ON beneficiaries
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. 확인
SELECT 'Table created successfully' as status;