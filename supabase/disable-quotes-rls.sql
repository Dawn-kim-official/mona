-- quotes 테이블의 RLS 비활성화 (개발 환경용)
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자가 모든 작업을 할 수 있도록 정책 추가
CREATE POLICY "Allow all operations for authenticated users" ON quotes
FOR ALL USING (auth.uid() IS NOT NULL);

-- 테이블 존재 여부 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'quotes'
);

-- quotes 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes'
ORDER BY ordinal_position;