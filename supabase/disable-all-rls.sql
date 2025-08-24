-- 모든 테이블의 RLS 비활성화 (개발용)
-- 프로덕션 배포 전에는 반드시 RLS를 다시 활성화해야 합니다!

-- 1. 모든 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert during registration" ON profiles;

-- businesses 테이블 정책 삭제
DO $$ 
BEGIN
    -- Drop all policies on businesses table
    DROP POLICY IF EXISTS "Users can view own business" ON businesses;
    DROP POLICY IF EXISTS "Users can update own business" ON businesses;
    DROP POLICY IF EXISTS "Admins can view all businesses" ON businesses;
    DROP POLICY IF EXISTS "Public can insert business" ON businesses;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- donations 테이블 정책 삭제
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Business can view own donations" ON donations;
    DROP POLICY IF EXISTS "Business can create donations" ON donations;
    DROP POLICY IF EXISTS "Business can update own donations" ON donations;
    DROP POLICY IF EXISTS "Admins can view all donations" ON donations;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- quotes 테이블 정책 삭제
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Business can view quotes for their donations" ON quotes;
    DROP POLICY IF EXISTS "Admins can manage all quotes" ON quotes;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- notifications 테이블 정책 삭제
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can create notifications" ON notifications;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 2. 모든 테이블의 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations DISABLE ROW LEVEL SECURITY;

-- 3. 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Storage 버킷 권한도 열어주기
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('business_licenses', 'donation_photos', 'quote_documents', 'contracts', 'tax_receipts', 'esg_reports');

-- 5. 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 결과가 모두 'f' (false)로 나와야 합니다