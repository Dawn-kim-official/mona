-- donations 테이블에 직접 배달 가능 여부 및 제품 상세정보 링크 컬럼 추가

-- 직접 배달 가능 여부 추가
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS direct_delivery_available BOOLEAN DEFAULT false;

-- 제품 상세정보 링크 추가
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS product_detail_url TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN donations.direct_delivery_available IS '직접 배달 가능 여부';
COMMENT ON COLUMN donations.product_detail_url IS '제품 상세정보 링크 URL';

-- 확인용 쿼리
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'donations' 
-- AND column_name IN ('direct_delivery_available', 'product_detail_url')
-- ORDER BY ordinal_position;