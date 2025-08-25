-- quotes 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'quotes'
ORDER BY 
  ordinal_position;

-- RLS 상태 확인
SELECT 
  tablename,
  rowsecurity
FROM 
  pg_tables
WHERE 
  tablename = 'quotes';

-- RLS 정책 확인
SELECT 
  policyname,
  cmd,
  roles
FROM 
  pg_policies
WHERE 
  tablename = 'quotes';