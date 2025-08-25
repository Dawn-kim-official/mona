-- beneficiaries 테이블 RLS 문제 간단 해결

-- 1. 현재 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'beneficiaries';

-- 2. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own beneficiary profile" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can update beneficiary status" ON beneficiaries;
DROP POLICY IF EXISTS "Beneficiaries can update own profile" ON beneficiaries;
DROP POLICY IF EXISTS "Anyone can insert beneficiary" ON beneficiaries;

-- 3. RLS 임시 비활성화 (개발 환경용)
ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;

-- 4. 확인
SELECT * FROM beneficiaries;

-- 5. 테스트 데이터가 있는지 확인
SELECT 
  b.id,
  b.organization_name,
  b.status,
  u.email
FROM beneficiaries b
JOIN auth.users u ON b.user_id = u.id;