-- ========================================
-- 1. 모든 테이블 목록과 RLS 상태 확인
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS 활성화됨'
        ELSE 'RLS 비활성화됨'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 2. 모든 RLS 정책 확인
-- ========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 3. 주요 테이블들의 컬럼 구조 확인
-- ========================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('businesses', 'beneficiaries', 'donations', 'donation_matches', 'quotes', 'profiles')
ORDER BY table_name, ordinal_position;

-- ========================================
-- 4. donations 테이블 상세 확인
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'donations'
ORDER BY ordinal_position;

-- ========================================
-- 5. 현재 사용자 권한 확인
-- ========================================
SELECT current_user, session_user;

-- ========================================
-- 6. 테이블별 권한 확인
-- ========================================
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND table_name IN ('donations', 'businesses', 'beneficiaries', 'donation_matches')
ORDER BY table_name, privilege_type;

-- ========================================
-- 7. RLS 정책 개수 확인
-- ========================================
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ========================================
-- 8. 모든 RLS 정책 비활성화 (문제 해결용)
-- ========================================
-- 주석을 제거하고 실행하세요
/*
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- 9. 모든 RLS 정책 삭제 (완전 초기화용)
-- ========================================
-- 주석을 제거하고 실행하세요
/*
-- businesses 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON businesses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON businesses;
DROP POLICY IF EXISTS "Enable update for users based on email" ON businesses;
DROP POLICY IF EXISTS "Businesses can update own profile" ON businesses;

-- beneficiaries 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON beneficiaries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON beneficiaries;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON beneficiaries;
DROP POLICY IF EXISTS "Beneficiaries can update own profile" ON beneficiaries;

-- donations 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON donations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON donations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON donations;

-- donation_matches 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON donation_matches;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON donation_matches;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON donation_matches;

-- quotes 테이블의 모든 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON quotes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON quotes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON quotes;
*/