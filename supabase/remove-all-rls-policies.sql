-- 모든 RLS 정책 완전 제거 (개발용)
-- 경고: 프로덕션에서는 절대 사용하지 마세요!

-- 1. storage.objects의 모든 정책 제거
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 2. storage.buckets의 모든 정책 제거
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'buckets' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', pol.policyname);
    END LOOP;
END $$;

-- 3. public 스키마의 모든 테이블 RLS 비활성화
DO $$ 
DECLARE
    t RECORD;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- 4. storage 스키마의 모든 테이블 RLS 비활성화 (권한이 있다면)
DO $$ 
BEGIN
    -- storage.objects RLS 비활성화 시도
    BEGIN
        EXECUTE 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Cannot disable RLS on storage.objects - insufficient privileges';
    END;
    
    -- storage.buckets RLS 비활성화 시도
    BEGIN
        EXECUTE 'ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Cannot disable RLS on storage.buckets - insufficient privileges';
    END;
END $$;

-- 5. 모든 버킷을 public으로 설정
UPDATE storage.buckets 
SET public = true;

-- 6. 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- 7. 남은 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;