-- beneficiaries 테이블 재생성 (백업 포함)

-- 1. 기존 데이터 백업
CREATE TEMP TABLE beneficiaries_backup AS 
SELECT * FROM beneficiaries;

-- 2. 관련 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own beneficiary profile" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can update beneficiary status" ON beneficiaries;
DROP POLICY IF EXISTS "Beneficiaries can update own profile" ON beneficiaries;
DROP POLICY IF EXISTS "Anyone can insert beneficiary" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can do everything with beneficiaries" ON beneficiaries;

-- 3. 테이블 삭제 및 재생성
DROP TABLE IF EXISTS beneficiaries CASCADE;

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

-- 4. 인덱스 추가
CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);

-- 5. RLS 활성화
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- 6. 간단한 정책 추가
-- 모든 인증된 사용자가 읽을 수 있도록 (임시)
CREATE POLICY "Anyone can read beneficiaries" ON beneficiaries
  FOR SELECT USING (true);

-- 인증된 사용자가 자신의 데이터 삽입
CREATE POLICY "Users can insert own beneficiary" ON beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 작업 가능
CREATE POLICY "Admins can do all" ON beneficiaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. 백업 데이터 복원
INSERT INTO beneficiaries 
SELECT * FROM beneficiaries_backup;

-- 8. 확인
SELECT COUNT(*) as total_count FROM beneficiaries;
SELECT * FROM beneficiaries LIMIT 5;