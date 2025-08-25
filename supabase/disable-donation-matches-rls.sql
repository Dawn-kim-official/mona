-- donation_matches 테이블의 RLS 임시 비활성화
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM 
  pg_tables
WHERE 
  tablename = 'donation_matches';