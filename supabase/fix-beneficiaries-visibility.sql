-- beneficiaries 테이블이 보이지 않는 문제 해결

-- 1. 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'beneficiaries'
) as table_exists;

-- 2. RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'beneficiaries';

-- 3. 현재 정책 확인
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'beneficiaries';

-- 4. 관리자가 beneficiaries 테이블을 볼 수 없다면, 정책 재생성
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can update beneficiary status" ON beneficiaries;

-- 새 정책 생성 (더 명확하게)
CREATE POLICY "Admins can do everything with beneficiaries" ON beneficiaries
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. 테이블 권한 재설정
GRANT ALL ON beneficiaries TO authenticated;
GRANT ALL ON beneficiaries TO service_role;

-- 6. 확인
SELECT 
  'Test query:' as info,
  COUNT(*) as beneficiary_count 
FROM beneficiaries;