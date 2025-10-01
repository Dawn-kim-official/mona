-- quotes 테이블의 현재 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'quotes';

-- quotes 테이블의 현재 정책들 확인
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'quotes';

-- donations 테이블의 RLS 상태도 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'donations';

-- 간단한 해결책: quotes와 donations 테이블의 RLS 비활성화
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- 또는 더 안전한 방법: 인증된 사용자가 자신의 기부 관련 quotes를 업데이트할 수 있도록 정책 생성
-- DROP POLICY IF EXISTS "Users can update quotes for their donations" ON quotes;
-- CREATE POLICY "Users can update quotes for their donations" ON quotes
-- FOR UPDATE
-- USING (
--     EXISTS (
--         SELECT 1 FROM donations d
--         JOIN businesses b ON d.business_id = b.id
--         WHERE d.id = quotes.donation_id
--         AND b.user_id = auth.uid()
--     )
-- );