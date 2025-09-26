-- ========================================
-- Reports 테이블 생성 및 업데이트
-- ========================================

-- 1. reports 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  report_url TEXT NOT NULL,
  media_links TEXT[] DEFAULT '{}',
  report_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. report_type 컬럼 제거 (있는 경우)
ALTER TABLE reports 
DROP COLUMN IF EXISTS report_type;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reports_business_id ON reports(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- 4. RLS 정책 설정 (필요한 경우)
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
-- CREATE POLICY "Admin full access to reports" ON reports
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'admin'
--     )
--   );

-- Businesses can view their own reports
-- CREATE POLICY "Businesses can view own reports" ON reports
--   FOR SELECT
--   TO authenticated
--   USING (
--     business_id IN (
--       SELECT id FROM businesses
--       WHERE user_id = auth.uid()
--     )
--   );

-- ========================================
-- 기존 데이터 마이그레이션 (필요한 경우)
-- ========================================

-- businesses 테이블의 esg_report_url을 reports 테이블로 마이그레이션
-- INSERT INTO reports (business_id, report_url, report_date)
-- SELECT id, esg_report_url, now()
-- FROM businesses
-- WHERE esg_report_url IS NOT NULL
-- AND NOT EXISTS (
--   SELECT 1 FROM reports 
--   WHERE reports.business_id = businesses.id 
--   AND reports.report_url = businesses.esg_report_url
-- );

-- ========================================
-- 확인용 쿼리
-- ========================================

-- reports 테이블 구조 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'reports'
-- ORDER BY ordinal_position;

-- 최근 리포트 확인
-- SELECT r.*, b.name as business_name
-- FROM reports r
-- JOIN businesses b ON r.business_id = b.id
-- ORDER BY r.created_at DESC
-- LIMIT 10;

-- ========================================
-- 완료 메시지
-- ========================================
-- reports 테이블이 성공적으로 생성/업데이트되었습니다.
-- - report_type 컬럼이 제거되었습니다
-- - 리포트 히스토리 관리 기능이 활성화되었습니다
-- - 리포트 삭제 기능이 사용 가능합니다