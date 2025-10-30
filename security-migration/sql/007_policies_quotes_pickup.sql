-- ============================================================================
-- RLS Policies: quotes, pickup_schedules 테이블
-- ============================================================================
-- 목적: 견적서 및 픽업 일정 관리
-- 난이도: 🟡 중간
-- 정책 수: 12개 (quotes 6개 + pickup_schedules 6개)
-- ============================================================================

-- ============================================================================
-- quotes 테이블 (견적서)
-- ============================================================================
-- - Admin이 견적서 생성
-- - Business가 본인 기부의 견적서 조회/수락/거절
-- - Beneficiary가 매칭된 기부의 견적서 조회

-- 정책 1: Business가 본인 기부의 견적 읽기
CREATE POLICY "quotes_select_own_business"
ON quotes
FOR SELECT
TO authenticated
USING (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Beneficiary가 매칭된 기부의 견적 읽기
CREATE POLICY "quotes_select_matched_beneficiary"
ON quotes
FOR SELECT
TO authenticated
USING (
  donation_id IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 3: Admin이 모든 견적 읽기
CREATE POLICY "quotes_select_admin"
ON quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Admin이 견적 생성
CREATE POLICY "quotes_insert_admin"
ON quotes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 5: Business가 견적 상태 변경 (수락/거절)
CREATE POLICY "quotes_update_own_business"
ON quotes
FOR UPDATE
TO authenticated
USING (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
)
WITH CHECK (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 6: Admin이 견적 수정
CREATE POLICY "quotes_update_admin"
ON quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- pickup_schedules 테이블 (픽업 일정)
-- ============================================================================
-- - Business가 본인 기부의 픽업 일정 생성/조회
-- - Beneficiary가 매칭된 기부의 픽업 일정 조회
-- - Admin이 픽업 일정 생성/조회/수정

-- 정책 1: Business가 본인 기부의 픽업 스케줄 읽기
CREATE POLICY "pickup_schedules_select_own_business"
ON pickup_schedules
FOR SELECT
TO authenticated
USING (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Beneficiary가 매칭된 기부의 픽업 스케줄 읽기
CREATE POLICY "pickup_schedules_select_matched_beneficiary"
ON pickup_schedules
FOR SELECT
TO authenticated
USING (
  donation_id IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 3: Admin이 모든 픽업 스케줄 읽기
CREATE POLICY "pickup_schedules_select_admin"
ON pickup_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Business가 본인 기부의 픽업 스케줄 생성
CREATE POLICY "pickup_schedules_insert_own_business"
ON pickup_schedules
FOR INSERT
TO authenticated
WITH CHECK (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 5: Admin이 픽업 스케줄 생성
CREATE POLICY "pickup_schedules_insert_admin"
ON pickup_schedules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 6: Admin/Business가 픽업 스케줄 수정
CREATE POLICY "pickup_schedules_update_admin_business"
ON pickup_schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================================================
-- Step 2: RLS 활성화 (정책 생성 후 실행)
-- ============================================================================

-- ⚠️ 주의: 이 명령은 정책이 모두 생성된 후에 실행하세요!
-- ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- quotes 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 80) as using_clause_preview
FROM pg_policies
WHERE tablename = 'quotes'
ORDER BY policyname;

-- pickup_schedules 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 80) as using_clause_preview
FROM pg_policies
WHERE tablename = 'pickup_schedules'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('quotes', 'pickup_schedules');

-- 정책 개수 확인
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('quotes', 'pickup_schedules')
GROUP BY tablename;
-- 예상 결과: quotes = 6, pickup_schedules = 6

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [quotes - 견적서]
-- ✅ Admin: 견적서 생성 (admin/donation/[id]/quote/page.tsx)
-- ✅ Admin: 견적서 목록 조회 (admin/quotes/page.tsx)
-- ✅ Admin: 견적서 수정
-- ✅ Business: 본인 기부의 견적서 조회 (business/donations/page.tsx)
-- ✅ 🔥 Business: 견적 수락 (status = 'accepted')
-- ✅ 🔥 Business: 견적 거절 (status = 'rejected')
-- ✅ Beneficiary: 매칭된 기부의 견적서 조회 (beneficiary/proposals/page.tsx)
-- ✅ Business: 다른 기업의 견적은 안 보임
--
-- [pickup_schedules - 픽업 일정]
-- ✅ 🔥 Business: 픽업 일정 등록 (business/donation/[id]/pickup-schedule/page.tsx)
-- ✅ Business: 본인 기부의 픽업 일정 조회
-- ✅ Admin: 픽업 일정 생성 (admin/donation/[id]/pickup/page.tsx)
-- ✅ Admin: 픽업 일정 조회/수정 (admin/donation/[id]/detail/page.tsx)
-- ✅ Beneficiary: 매칭된 기부의 픽업 일정 조회 (beneficiary/proposal/[id]/page.tsx)
-- ✅ Business: 다른 기업의 픽업 일정은 안 보임

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE pickup_schedules DISABLE ROW LEVEL SECURITY;

-- quotes 정책 삭제
-- DROP POLICY IF EXISTS "quotes_select_own_business" ON quotes;
-- DROP POLICY IF EXISTS "quotes_select_matched_beneficiary" ON quotes;
-- DROP POLICY IF EXISTS "quotes_select_admin" ON quotes;
-- DROP POLICY IF EXISTS "quotes_insert_admin" ON quotes;
-- DROP POLICY IF EXISTS "quotes_update_own_business" ON quotes;
-- DROP POLICY IF EXISTS "quotes_update_admin" ON quotes;

-- pickup_schedules 정책 삭제
-- DROP POLICY IF EXISTS "pickup_schedules_select_own_business" ON pickup_schedules;
-- DROP POLICY IF EXISTS "pickup_schedules_select_matched_beneficiary" ON pickup_schedules;
-- DROP POLICY IF EXISTS "pickup_schedules_select_admin" ON pickup_schedules;
-- DROP POLICY IF EXISTS "pickup_schedules_insert_own_business" ON pickup_schedules;
-- DROP POLICY IF EXISTS "pickup_schedules_insert_admin" ON pickup_schedules;
-- DROP POLICY IF EXISTS "pickup_schedules_update_admin_business" ON pickup_schedules;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 3)
-- ============================================================================
-- 1. 006_policies_matches.sql 적용 완료 후
-- 2. 이 파일의 Step 1 실행 (정책 생성)
-- 3. 확인 쿼리로 정책 검증 (각각 6개씩)
-- 4. ALTER TABLE ... ENABLE ROW LEVEL SECURITY 실행
-- 5. 견적 워크플로우 테스트:
--    - Admin: 견적서 생성
--    - Business: 견적 조회
--    - Business: 견적 수락
-- 6. 픽업 워크플로우 테스트:
--    - Business: 픽업 일정 등록
--    - Beneficiary: 픽업 정보 조회
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🟡 중간
-- 예상 소요: 20분
-- 중요도: ⭐⭐⭐⭐
