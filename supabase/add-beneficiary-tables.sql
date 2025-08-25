-- 수혜자(beneficiary) 기능 추가를 위한 데이터베이스 스키마 업데이트

-- 1. profiles 테이블에 beneficiary role 추가
-- (이미 admin, business가 있으므로 beneficiary 추가)

-- 2. 수혜자 정보를 저장할 beneficiaries 테이블 생성
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(100), -- 복지관, NGO, 사회복지기관 등
  representative_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  registration_number VARCHAR(50), -- 고유번호/사업자등록번호
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기부 매칭 테이블 생성 (관리자가 수혜자에게 기부 제안)
CREATE TABLE IF NOT EXISTS donation_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES auth.users(id), -- 제안한 관리자
  status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, rejected, received
  proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  receipt_photos TEXT[], -- 수령 확인 사진 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(donation_id, beneficiary_id)
);

-- 4. RLS 정책 추가
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- beneficiaries 테이블 정책
-- 본인 정보 조회
CREATE POLICY "Users can view own beneficiary profile" ON beneficiaries
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 수혜자 조회 가능
CREATE POLICY "Admins can view all beneficiaries" ON beneficiaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 관리자는 수혜자 상태 업데이트 가능
CREATE POLICY "Admins can update beneficiary status" ON beneficiaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 수혜자 본인은 자신의 정보 업데이트 가능 (상태 제외)
CREATE POLICY "Beneficiaries can update own profile" ON beneficiaries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = OLD.status);

-- 신규 수혜자 등록
CREATE POLICY "Anyone can insert beneficiary" ON beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- donation_matches 테이블 정책
-- 관리자는 매칭 생성 가능
CREATE POLICY "Admins can create matches" ON donation_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 수혜자는 자신에게 제안된 매칭 조회 가능
CREATE POLICY "Beneficiaries can view own matches" ON donation_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM beneficiaries
      WHERE beneficiaries.id = donation_matches.beneficiary_id
      AND beneficiaries.user_id = auth.uid()
    )
  );

-- 관리자는 모든 매칭 조회 가능
CREATE POLICY "Admins can view all matches" ON donation_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 수혜자는 자신의 매칭 상태 업데이트 가능 (수락/거절/수령확인)
CREATE POLICY "Beneficiaries can update own match status" ON donation_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM beneficiaries
      WHERE beneficiaries.id = donation_matches.beneficiary_id
      AND beneficiaries.user_id = auth.uid()
    )
  );

-- 관리자도 매칭 상태 업데이트 가능
CREATE POLICY "Admins can update match status" ON donation_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 인덱스 추가
CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX idx_donation_matches_donation_id ON donation_matches(donation_id);
CREATE INDEX idx_donation_matches_beneficiary_id ON donation_matches(beneficiary_id);
CREATE INDEX idx_donation_matches_status ON donation_matches(status);