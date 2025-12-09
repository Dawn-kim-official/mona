-- Add commission fields to quotes table
-- 견적서 테이블에 수수료 관련 컬럼 추가

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS commission_amount INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN quotes.commission_rate IS '수수료율 (%) - 어드민만 입력/조회 가능';
COMMENT ON COLUMN quotes.commission_amount IS '수수료 금액 (원) - 공급가액 기준 계산';

-- 기존 데이터에 대한 기본값 설정 (필요시)
-- UPDATE quotes
-- SET commission_rate = 10.00,
--     commission_amount = ROUND(CAST((unit_price * COALESCE((SELECT quantity FROM donations WHERE id = donation_id), 0)) AS DECIMAL) * 0.1)
-- WHERE commission_rate IS NULL;

-- 변경사항 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes'
AND column_name IN ('commission_rate', 'commission_amount')
ORDER BY ordinal_position;
