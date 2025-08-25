-- donation_matches 테이블에 영수증 관련 컬럼 추가
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS receipt_issued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receipt_issued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receipt_file_url TEXT;
