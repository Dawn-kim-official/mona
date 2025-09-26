-- businesses 테이블에 address 컬럼 추가
-- 메인 주소를 저장하기 위한 컬럼

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN businesses.address IS '기본 주소 (도로명 또는 지번 주소)';

-- 확인용 쿼리
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'businesses' 
-- AND column_name IN ('address', 'postcode', 'detail_address')
-- ORDER BY ordinal_position;