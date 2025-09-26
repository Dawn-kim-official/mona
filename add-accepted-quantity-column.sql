-- ========================================
-- donation_matches 테이블에 accepted_quantity, accepted_unit 컬럼 추가
-- ========================================

-- 1. accepted_quantity 컬럼 추가 (수락한 수량)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS accepted_quantity NUMERIC;

-- 2. accepted_unit 컬럼 추가 (수량 단위)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS accepted_unit TEXT;

-- 3. quote_sent_at 컬럼 추가 (견적서 발송 시간)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;

-- 4. received_at 컬럼 추가 (수령 완료 시간)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- 5. receipt_file_url 컬럼 추가 (영수증 파일 URL)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS receipt_file_url TEXT;

-- 6. updated_at 컬럼 추가
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ========================================
-- 확인용 쿼리
-- ========================================

-- donation_matches 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donation_matches'
ORDER BY ordinal_position;

-- ========================================
-- 완료 메시지
-- ========================================
-- donation_matches 테이블에 필요한 컬럼들이 추가되었습니다:
-- - accepted_quantity: 수혜기관이 수락한 수량
-- - accepted_unit: 수량 단위
-- - quote_sent_at: 견적서 발송 시간
-- - received_at: 수령 완료 시간
-- - receipt_file_url: 영수증 파일 URL
-- - updated_at: 마지막 업데이트 시간