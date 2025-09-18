-- donation_matches 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS donation_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, rejected, received
  proposed_at TIMESTAMP DEFAULT NOW(),
  proposed_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMP,
  received_at TIMESTAMP,
  receipt_issued BOOLEAN DEFAULT FALSE,
  receipt_issued_at TIMESTAMP,
  receipt_photos TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(donation_id, beneficiary_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_donation_matches_donation_id ON donation_matches(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_matches_beneficiary_id ON donation_matches(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_donation_matches_status ON donation_matches(status);

-- RLS 비활성화 (개발 환경용)
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 기존 matched된 donations 데이터를 donation_matches로 마이그레이션
INSERT INTO donation_matches (donation_id, beneficiary_id, status, proposed_at)
SELECT 
  d.id as donation_id,
  b.id as beneficiary_id,
  CASE 
    WHEN d.status = 'matched' THEN 'proposed'
    WHEN d.status = 'pickup_scheduled' THEN 'accepted'
    WHEN d.status = 'completed' THEN 'received'
    ELSE 'proposed'
  END as status,
  COALESCE(d.matched_at, d.created_at) as proposed_at
FROM donations d
JOIN beneficiaries b ON b.organization_name = d.matched_charity_name
WHERE d.matched_charity_name IS NOT NULL
ON CONFLICT (donation_id, beneficiary_id) DO NOTHING;