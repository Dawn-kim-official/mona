-- donations 테이블에 세금계산서 관련 필드 추가
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS tax_invoice_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

-- businesses 테이블에 업종 필드 추가 (기본값으로 사용)
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

-- 세금계산서 발급 이력을 위한 별도 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS tax_invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id),
  business_id UUID REFERENCES businesses(id),
  invoice_number VARCHAR(50),
  issued_at TIMESTAMP,
  email VARCHAR(255),
  business_type VARCHAR(100),
  amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, issued, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tax_invoices_donation_id ON tax_invoices(donation_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_business_id ON tax_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_donations_tax_deduction ON donations(tax_deduction_needed);