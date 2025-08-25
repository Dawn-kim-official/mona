-- 수혜기관 회원가입 문제 해결 (간단 버전)

-- 1. 먼저 테이블이 있는지 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'beneficiaries'
) as beneficiaries_table_exists;

-- 2. profiles 테이블에 INSERT 정책 추가
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. 모든 미확인 사용자를 확인 처리 (개발 환경용)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. 확인
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'beneficiaries')
ORDER BY tablename, policyname;