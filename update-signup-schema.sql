-- 새로운 회원가입 폼에 맞춰 DB 스키마 업데이트
-- 2024년 새 회원가입 양식에 맞춘 필드 추가

-- ========================================
-- 1. businesses 테이블 컬럼 추가
-- ========================================

-- 등록번호 (사업자등록번호) 추가
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(50);

-- SNS 링크 추가
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS sns_link TEXT;

-- 우편번호 추가
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);

-- 상세주소 추가
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS detail_address TEXT;

-- ========================================
-- 2. beneficiaries 테이블 컬럼 추가
-- ========================================

-- 웹사이트 URL 추가
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS website TEXT;

-- SNS 링크 추가
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS sns_link TEXT;

-- 우편번호 추가
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);

-- 상세주소 추가
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS detail_address TEXT;

-- 등록증 파일 URL 추가 (고유번호증, 비영리단체 등록증 등)
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS tax_exempt_cert_url TEXT;

-- ========================================
-- 3. 기존 데이터 마이그레이션 (필요시)
-- ========================================

-- businesses 테이블의 기존 address를 파싱하여 postcode와 detail_address 분리 (선택사항)
-- 이미 등록된 사업자가 있다면 수동으로 업데이트 필요

-- ========================================
-- 4. 컬럼 코멘트 추가 (문서화)
-- ========================================

COMMENT ON COLUMN businesses.business_registration_number IS '사업자등록번호';
COMMENT ON COLUMN businesses.sns_link IS 'SNS 링크 (인스타그램, 페이스북 등)';
COMMENT ON COLUMN businesses.postcode IS '우편번호';
COMMENT ON COLUMN businesses.detail_address IS '상세주소';

COMMENT ON COLUMN beneficiaries.website IS '기관 웹사이트 URL';
COMMENT ON COLUMN beneficiaries.sns_link IS 'SNS 링크 (인스타그램, 페이스북 등)';
COMMENT ON COLUMN beneficiaries.postcode IS '우편번호';
COMMENT ON COLUMN beneficiaries.detail_address IS '상세주소';
COMMENT ON COLUMN beneficiaries.tax_exempt_cert_url IS '고유번호증 또는 비영리단체 등록증 파일 URL';

-- ========================================
-- 5. 테이블 구조 확인
-- ========================================

-- 업데이트 후 테이블 구조 확인용 쿼리
-- SELECT column_name, data_type, character_maximum_length, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'businesses' 
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, character_maximum_length, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'beneficiaries' 
-- ORDER BY ordinal_position;