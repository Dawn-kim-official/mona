-- ============================================================================
-- RLS Policies: businesses, beneficiaries 테이블
-- ============================================================================
-- 목적: 기업/수혜기관 정보 관리
-- 난이도: 🟡 중간
-- 정책 수: 11개 (businesses 6개 + beneficiaries 5개)
-- ============================================================================

-- 🔥 핵심: Beneficiary가 매칭된 기부의 Business 정보를 볼 수 있어야 함!
-- 경로: beneficiaries → donation_matches → donations → businesses

-- ============================================================================
-- businesses 테이블 (기업 정보)
-- ============================================================================

-- 정책 1: Business 본인 읽기
CREATE POLICY "businesses_select_own"
ON businesses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 정책 2: Admin 모든 business 읽기
CREATE POLICY "businesses_select_admin"
ON businesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 3: Beneficiary는 매칭된 기부의 business 읽기 (크로스 조인!)
CREATE POLICY "businesses_select_matched_beneficiary"
ON businesses
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT d.business_id
    FROM donations d
    JOIN donation_matches dm ON d.id = dm.donation_id
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 4: Business 본인 정보 수정
CREATE POLICY "businesses_update_own"
ON businesses
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 정책 5: Admin이 business status 승인/거절
CREATE POLICY "businesses_update_admin"
ON businesses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 6: 회원가입 시 business 생성
CREATE POLICY "businesses_insert_own"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- beneficiaries 테이블 (수혜기관 정보)
-- ============================================================================

-- 정책 1: Beneficiary 본인 읽기
CREATE POLICY "beneficiaries_select_own"
ON beneficiaries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 정책 2: Admin 모든 beneficiary 읽기
CREATE POLICY "beneficiaries_select_admin"
ON beneficiaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Beneficiary 본인 정보 수정
CREATE POLICY "beneficiaries_update_own"
ON beneficiaries
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 정책 4: Admin이 beneficiary status 승인/거절
CREATE POLICY "beneficiaries_update_admin"
ON beneficiaries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 5: 회원가입 시 beneficiary 생성
CREATE POLICY "beneficiaries_insert_own"
ON beneficiaries
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Step 2: RLS 활성화 (정책 생성 후 실행)
-- ============================================================================

-- ⚠️ 주의: 이 명령은 정책이 모두 생성된 후에 실행하세요!
-- ⚠️ 반드시 businesses와 beneficiaries를 동시에 활성화해야 함!
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- businesses 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 80) as using_clause_preview
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;

-- beneficiaries 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 80) as using_clause_preview
FROM pg_policies
WHERE tablename = 'beneficiaries'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('businesses', 'beneficiaries');

-- 인덱스 확인 (성능 체크)
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('businesses', 'beneficiaries')
  AND indexname LIKE '%user_id%'
ORDER BY tablename;

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [businesses]
-- ✅ Business: 본인 프로필 조회/수정 (business/profile/page.tsx)
-- ✅ Admin: 회원 목록 조회 (admin/businesses/page.tsx)
-- ✅ Admin: 회원 승인/거절
-- ✅ 🔥 Beneficiary: 제안받은 기부의 Business 정보 조회 (beneficiary/proposal/[id]/page.tsx)
--    - 이게 가장 중요! 매칭된 기부의 기업 이름, 주소, 연락처가 보여야 함
--
-- [beneficiaries]
-- ✅ Beneficiary: 본인 프로필 조회/수정 (beneficiary/profile/page.tsx)
-- ✅ Admin: 회원 목록 조회 (admin/businesses/page.tsx)
-- ✅ Admin: 회원 승인/거절
-- ✅ Beneficiary: 회원가입 (signup/page.tsx)

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;

-- businesses 정책 삭제
-- DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
-- DROP POLICY IF EXISTS "businesses_select_admin" ON businesses;
-- DROP POLICY IF EXISTS "businesses_select_matched_beneficiary" ON businesses;
-- DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
-- DROP POLICY IF EXISTS "businesses_update_admin" ON businesses;
-- DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;

-- beneficiaries 정책 삭제
-- DROP POLICY IF EXISTS "beneficiaries_select_own" ON beneficiaries;
-- DROP POLICY IF EXISTS "beneficiaries_select_admin" ON beneficiaries;
-- DROP POLICY IF EXISTS "beneficiaries_update_own" ON beneficiaries;
-- DROP POLICY IF EXISTS "beneficiaries_update_admin" ON beneficiaries;
-- DROP POLICY IF EXISTS "beneficiaries_insert_own" ON beneficiaries;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 2)
-- ============================================================================
-- 1. 003_policies_simple_tables.sql 적용 완료 후
-- 2. 이 파일의 Step 1 실행 (정책 생성)
-- 3. 확인 쿼리로 정책 검증
-- 4. 인덱스 확인 (user_id 인덱스 있는지)
-- 5. ALTER TABLE ... ENABLE ROW LEVEL SECURITY 실행 (동시에!)
-- 6. 🔥 크로스 조인 테스트 (Beneficiary → Business 정보)
-- 7. 앱에서 전체 기능 테스트
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🟡 중간
-- 예상 소요: 20분
-- 중요도: ⭐⭐⭐ (크로스 조인 핵심!)
