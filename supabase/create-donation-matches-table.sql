-- donation_matches 테이블 생성

CREATE TABLE donation_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'proposed',
  proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  receipt_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(donation_id, beneficiary_id)
);

-- 인덱스 추가
CREATE INDEX idx_donation_matches_donation_id ON donation_matches(donation_id);
CREATE INDEX idx_donation_matches_beneficiary_id ON donation_matches(beneficiary_id);
CREATE INDEX idx_donation_matches_status ON donation_matches(status);

-- RLS 활성화
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- 정책 추가
-- 관리자는 모든 작업 가능
CREATE POLICY "Admins can do all" ON donation_matches
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 수혜자는 자신의 매칭 조회 가능
CREATE POLICY "Beneficiaries can view own matches" ON donation_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM beneficiaries
      WHERE beneficiaries.id = donation_matches.beneficiary_id
      AND beneficiaries.user_id = auth.uid()
    )
  );

-- 수혜자는 자신의 매칭 업데이트 가능
CREATE POLICY "Beneficiaries can update own matches" ON donation_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM beneficiaries
      WHERE beneficiaries.id = donation_matches.beneficiary_id
      AND beneficiaries.user_id = auth.uid()
    )
  );

SELECT 'Table created successfully' as status;