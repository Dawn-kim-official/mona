-- ========================================
-- 모든 최근 변경사항 적용 SQL
-- 2025년 1월 기준 업데이트
-- ========================================

-- 1. businesses 테이블에 address 컬럼 추가 (사업지 주소 자동입력용)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN businesses.address IS '기본 주소 (도로명 또는 지번 주소)';

-- 2. donations 테이블에 직접 배달 및 제품 상세정보 컬럼 추가
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS direct_delivery_available BOOLEAN DEFAULT false;

ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS product_detail_url TEXT;

COMMENT ON COLUMN donations.direct_delivery_available IS '직접 배달 가능 여부';
COMMENT ON COLUMN donations.product_detail_url IS '제품 상세정보 링크 URL';

-- ========================================
-- 확인용 쿼리
-- ========================================

-- businesses 테이블 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'businesses' 
-- AND column_name IN ('address', 'postcode', 'detail_address')
-- ORDER BY ordinal_position;

-- donations 테이블 확인  
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'donations' 
-- AND column_name IN ('direct_delivery_available', 'product_detail_url')
-- ORDER BY ordinal_position;

-- ========================================
-- 적용 완료 메시지
-- ========================================
-- 모든 컬럼이 성공적으로 추가되었습니다.
-- 1. businesses.address - 사업지 주소 저장
-- 2. donations.direct_delivery_available - 직접 배달 가능 여부
-- 3. donations.product_detail_url - 제품 상세정보 링크