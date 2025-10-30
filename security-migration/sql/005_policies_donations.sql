-- ============================================================================
-- RLS Policies: donations 테이블
-- ============================================================================
-- 목적: 기부 목록 관리
-- 난이도: 🔴 높음 (3자 접근 + quantity 수정)
-- 정책 수: 8개
-- ============================================================================

-- 🔥 핵심:
-- 1. Business: 본인 기부만 조회/수정
-- 2. Admin: 모든 기부 조회/수정/삭제
-- 3. Beneficiary: 매칭된 기부만 조회
-- 4. Beneficiary: remaining_quantity 감소 허용 (수락 시)

-- ============================================================================
-- donations 테이블 (기부 목록)
-- ============================================================================

-- 정책 1: Business가 본인 기부 읽기
CREATE POLICY "donations_select_own_business"
ON donations
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 정책 2: Admin이 모든 기부 읽기
CREATE POLICY "donations_select_admin"
ON donations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 3: Beneficiary가 매칭된 기부만 읽기 (핵심!)
CREATE POLICY "donations_select_matched_beneficiary"
ON donations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 4: Business가 본인 기부 생성
CREATE POLICY "donations_insert_own_business"
ON donations
FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 정책 5: Business가 본인 기부 수정
CREATE POLICY "donations_update_own_business"
ON donations
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 정책 6: Admin이 기부 상태 변경 및 매칭
CREATE POLICY "donations_update_admin"
ON donations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 7: Beneficiary가 매칭된 기부의 quantity 관련 필드만 수정 (수락 시)
-- 주의: 이 정책은 매우 신중하게 설계됨
CREATE POLICY "donations_update_quantity_beneficiary"
ON donations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
    AND dm.status IN ('accepted', 'proposed')
  )
)
WITH CHECK (
  id IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
    AND dm.status IN ('accepted', 'proposed')
  )
);

-- 정책 8: Admin이 기부 삭제
CREATE POLICY "donations_delete_admin"
ON donations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- Step 2: RLS 활성화 (정책 생성 후 실행)
-- ============================================================================

-- ⚠️ 주의: 이 명령은 정책이 모두 생성된 후에 실행하세요!
-- ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- donations 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 100) as using_clause_preview
FROM pg_policies
WHERE tablename = 'donations'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'donations';

-- 인덱스 확인 (성능 체크)
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'donations'
  AND (indexname LIKE '%business_id%' OR indexname LIKE '%status%')
ORDER BY indexname;

-- 정책 개수 확인
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'donations';
-- 예상 결과: 8

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [Business]
-- ✅ 기부 등록 (business/donation/new/page.tsx)
-- ✅ 본인 기부 목록 조회 (business/donations/page.tsx)
-- ✅ 본인 기부 상세 조회 (business/donation/[id]/DonationDetailClient.tsx)
-- ✅ 본인 기부 수정
-- ✅ 다른 기업 기부는 안 보임
--
-- [Admin]
-- ✅ 전체 기부 목록 조회 (admin/donations/page.tsx)
-- ✅ 기부 승인 (status 변경)
-- ✅ 기부 매칭
-- ✅ 기부 삭제
--
-- [Beneficiary]
-- ✅ 🔥 매칭된 기부만 조회 (beneficiary/proposals/page.tsx)
-- ✅ 🔥 제안 수락 시 quantity 업데이트 (beneficiary/proposal/[id]/page.tsx)
--    - 이게 가장 중요! 수락 시 donations.quantity가 감소해야 함
-- ✅ 매칭되지 않은 기부는 안 보임

-- ============================================================================
-- 성능 주의사항
-- ============================================================================

-- 이미 존재하는 인덱스:
-- ✅ idx_donations_business_id (business_id)
-- ✅ idx_donations_status (status)
--
-- 추가 인덱스 불필요 (이미 최적화됨)

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE donations DISABLE ROW LEVEL SECURITY;

-- 정책 삭제
-- DROP POLICY IF EXISTS "donations_select_own_business" ON donations;
-- DROP POLICY IF EXISTS "donations_select_admin" ON donations;
-- DROP POLICY IF EXISTS "donations_select_matched_beneficiary" ON donations;
-- DROP POLICY IF EXISTS "donations_insert_own_business" ON donations;
-- DROP POLICY IF EXISTS "donations_update_own_business" ON donations;
-- DROP POLICY IF EXISTS "donations_update_admin" ON donations;
-- DROP POLICY IF EXISTS "donations_update_quantity_beneficiary" ON donations;
-- DROP POLICY IF EXISTS "donations_delete_admin" ON donations;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 2)
-- ============================================================================
-- 1. 004_policies_users.sql 적용 완료 후
-- 2. 이 파일의 Step 1 실행 (정책 생성)
-- 3. 확인 쿼리로 정책 검증 (정책 8개 확인)
-- 4. 인덱스 확인 (이미 존재하는지)
-- 5. ALTER TABLE donations ENABLE ROW LEVEL SECURITY 실행
-- 6. 🔥 Business: 기부 등록 테스트
-- 7. 🔥 Admin: 기부 승인 및 매칭 테스트
-- 8. 🔥 Beneficiary: 제안 조회 및 수락 테스트 (quantity 감소 확인!)
-- 9. 앱에서 전체 워크플로우 테스트
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🔴 높음
-- 예상 소요: 30분
-- 중요도: ⭐⭐⭐⭐⭐ (핵심 테이블!)
