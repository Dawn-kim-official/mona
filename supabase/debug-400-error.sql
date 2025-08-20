-- 1. 현재 RLS 상태 확인
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 현재 정책 개수 확인
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. anon 권한 확인
SELECT DISTINCT
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
AND table_schema = 'public';

-- 4. 모든 테이블에 대해 RLS 비활성화 (개발용 임시 조치)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations DISABLE ROW LEVEL SECURITY;

-- 5. anon에게 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;