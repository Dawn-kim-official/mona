-- RLS 비활성화 스크립트
-- 개발 환경에서만 사용하세요. 프로덕션에서는 적절한 RLS 정책을 설정해야 합니다.

-- 1. donations 테이블 RLS 비활성화
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- 2. quotes 테이블 RLS 비활성화  
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- 3. donation_matches 테이블 RLS 비활성화
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 4. businesses 테이블 RLS 비활성화
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- 5. beneficiaries 테이블 RLS 비활성화
ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;

-- 6. pickup_schedules 테이블 RLS 비활성화
ALTER TABLE pickup_schedules DISABLE ROW LEVEL SECURITY;

-- RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('donations', 'quotes', 'donation_matches', 'businesses', 'beneficiaries', 'pickup_schedules');

-- 참고: 프로덕션에서는 다음과 같은 정책을 추가해야 합니다
-- 예시:
-- ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own donations" ON donations
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own donations" ON donations
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 등등...