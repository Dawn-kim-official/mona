-- ========================================
-- donation_matches 테이블에 누락된 컬럼 추가
-- ========================================

-- 1. accepted_quantity 컬럼 추가 (수혜기관이 수락한 수량)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS accepted_quantity NUMERIC;

-- 2. accepted_unit 컬럼 추가 (수량 단위: kg, 개 등)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS accepted_unit VARCHAR(50);

-- 3. quote_sent_at 컬럼 추가 (견적서 발송 시간)
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;

-- ========================================
-- 추가 완료 확인
-- ========================================
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donation_matches' 
AND column_name IN ('accepted_quantity', 'accepted_unit', 'quote_sent_at')
ORDER BY ordinal_position;

-- ========================================
-- 실행 결과 메시지
-- ========================================
-- 다음 컬럼들이 donation_matches 테이블에 추가되었습니다:
-- 1. accepted_quantity: 수혜기관이 수락한 수량 저장
-- 2. accepted_unit: 수량 단위 저장 (kg, 개 등)  
-- 3. quote_sent_at: 견적서 발송 시간 기록