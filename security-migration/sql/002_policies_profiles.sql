-- ============================================================================
-- RLS Policies: profiles 테이블
-- ============================================================================
-- 목적: 사용자 인증 및 역할 관리
-- 난이도: 🟢 쉬움
-- 정책 수: 3개
-- ============================================================================

-- 테이블 정보
-- - profiles.id = auth.users.id (1:1)
-- - profiles.role: 'business' | 'admin' | 'beneficiary'
-- - 모든 사용자는 자기 프로필만 읽기/수정 가능
-- - Admin은 모든 프로필 읽기 가능
-- - role 필드는 수정 불가 (보안)

-- ============================================================================
-- Step 1: 정책 생성 (RLS 비활성화 상태에서)
-- ============================================================================

-- 정책 1: 자기 자신 프로필 읽기
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 정책 2: Admin은 모든 프로필 읽기
CREATE POLICY "profiles_select_admin"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: 자기 자신 프로필 수정 (role 제외)
-- role 변경 방지: 현재 role과 동일해야만 수정 가능
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- ============================================================================
-- Step 2: RLS 활성화 (정책 생성 후 실행)
-- ============================================================================

-- ⚠️ 주의: 이 명령은 정책이 모두 생성된 후에 실행하세요!
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- 생성된 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- RLS가 제대로 작동하는지 빠르게 확인
-- 앱에서 로그인 후 다음 기능들이 정상 작동하는지 확인:
-- ✅ Business/Beneficiary/Admin 로그인
-- ✅ 프로필 조회 가능
-- ✅ 프로필 수정 가능
-- ✅ 다른 사람 프로필은 안 보임 (Admin 제외)

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 정책 삭제
-- DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
-- DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
-- DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 1)
-- ============================================================================
-- 1. 이 파일의 Step 1 실행 (정책 생성)
-- 2. 정책 확인 쿼리 실행
-- 3. ALTER TABLE profiles ENABLE ROW LEVEL SECURITY 실행
-- 4. 테스트 쿼리로 검증
-- 5. 앱에서 로그인 테스트
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🟢 쉬움
-- 예상 소요: 10분
