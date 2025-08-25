-- donation_matches 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'donation_matches'
ORDER BY 
  ordinal_position;

-- donation_matches 테이블의 RLS 정책 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM 
  pg_policies
WHERE 
  tablename = 'donation_matches';

-- 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'donation_matches'
);