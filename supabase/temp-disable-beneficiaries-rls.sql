-- 임시로 beneficiaries 테이블의 RLS 비활성화 (개발용)
-- 주의: 프로덕션에서는 사용하지 마세요!

-- RLS 비활성화
ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'beneficiaries';

-- 테스트 쿼리
SELECT * FROM beneficiaries LIMIT 5;