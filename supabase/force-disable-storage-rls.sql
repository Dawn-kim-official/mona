-- Storage RLS 강제 비활성화

-- 1. 모든 storage.objects 정책 확인 및 삭제
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
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 2. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- 3. 만약 RLS가 여전히 활성화되어 있다면 (true로 표시되면)
-- Supabase Dashboard에서 직접 비활성화해야 합니다

-- 4. 임시 해결책: 모든 작업을 허용하는 정책 추가
CREATE POLICY "Allow all operations" ON storage.objects
FOR ALL 
TO public
USING (true)
WITH CHECK (true);

-- 5. 결과 확인
SELECT 
    policyname,
    tablename,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';