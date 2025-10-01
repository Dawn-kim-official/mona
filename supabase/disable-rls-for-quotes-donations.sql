-- quotes 테이블의 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'quotes';

-- quotes와 donations 테이블의 RLS 비활성화
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- 비활성화 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('quotes', 'donations');

-- 만약 비활성화가 안 되고 정책으로 해결하고 싶다면:
-- quotes 테이블에 대한 모든 권한 허용 정책
-- DROP POLICY IF EXISTS "Enable all for authenticated users" ON quotes;
-- CREATE POLICY "Enable all for authenticated users" ON quotes
-- FOR ALL 
-- USING (true)
-- WITH CHECK (true);

-- donations 테이블에 대한 모든 권한 허용 정책
-- DROP POLICY IF EXISTS "Enable all for authenticated users" ON donations;
-- CREATE POLICY "Enable all for authenticated users" ON donations
-- FOR ALL 
-- USING (true)
-- WITH CHECK (true);