-- ============================================================================
-- RLS Policies: donation_matches 테이블
-- ============================================================================
-- 목적: 기부-수혜기관 매칭 관리
-- 난이도: 🔴🔴 매우 높음 (전체 시스템의 핵심!)
-- 정책 수: 6개
-- ============================================================================

-- 🔥 핵심:
-- 1. Admin: 임의의 기부와 수혜기관을 매칭 (여러 개 동시)
-- 2. Beneficiary: 본인 제안만 조회/수락/거절/수령확인
-- 3. Business: 본인 기부의 매칭 상태 조회
-- 4. Admin: 매칭 상태 변경 (견적 발송 등)

-- ============================================================================
-- donation_matches 테이블 (기부-수혜기관 매칭)
-- ============================================================================

-- 정책 1: Business가 본인 기부의 매칭 읽기
CREATE POLICY "donation_matches_select_own_business"
ON donation_matches
FOR SELECT
TO authenticated
USING (
  donation_id IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Beneficiary가 본인에게 제안된 매칭 읽기
CREATE POLICY "donation_matches_select_own_beneficiary"
ON donation_matches
FOR SELECT
TO authenticated
USING (
  beneficiary_id IN (
    SELECT id FROM beneficiaries WHERE user_id = auth.uid()
  )
);

-- 정책 3: Admin이 모든 매칭 읽기
CREATE POLICY "donation_matches_select_admin"
ON donation_matches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 4: Admin이 매칭 생성 (제안)
-- Admin은 임의의 donation_id와 beneficiary_id 조합으로 매칭 생성 가능
CREATE POLICY "donation_matches_insert_admin"
ON donation_matches
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔥 정책 5: Beneficiary가 본인 매칭 상태 변경 (수락/거절/수령확인)
-- status, responded_at, received_at, receipt_photos, receipt_file_url 등 업데이트
CREATE POLICY "donation_matches_update_own_beneficiary"
ON donation_matches
FOR UPDATE
TO authenticated
USING (
  beneficiary_id IN (
    SELECT id FROM beneficiaries WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  beneficiary_id IN (
    SELECT id FROM beneficiaries WHERE user_id = auth.uid()
  )
);

-- 정책 6: Admin이 매칭 상태 변경 (견적 발송, 관리)
CREATE POLICY "donation_matches_update_admin"
ON donation_matches
FOR UPDATE
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
-- ⚠️ donations 테이블 RLS가 먼저 활성화되어 있어야 함!
-- ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- donation_matches 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  LEFT(qual::text, 100) as using_clause_preview
FROM pg_policies
WHERE tablename = 'donation_matches'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'donation_matches';

-- 인덱스 확인 (성능 체크)
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'donation_matches'
ORDER BY indexname;

-- 정책 개수 확인
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'donation_matches';
-- 예상 결과: 6

-- Unique 제약 확인 (중복 매칭 방지)
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'donation_matches'::regclass
  AND contype = 'u';
-- 예상: donation_matches_donation_id_beneficiary_id_key

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [Admin - 매칭 생성]
-- ✅ 🔥 Admin: 기부 매칭 (admin/donation/[id]/propose/page.tsx)
--    - 여러 수혜기관 선택 가능
--    - 각각 다른 quantity 설정 가능
--    - 한 번에 여러 개 INSERT
-- ✅ Admin: 매칭 목록 조회 (admin/donation/[id]/matches/page.tsx)
--
-- [Beneficiary - 제안 응답]
-- ✅ 🔥 Beneficiary: 제안받은 기부 목록 (beneficiary/proposals/page.tsx)
-- ✅ 🔥 Beneficiary: 제안 상세 조회 (beneficiary/proposal/[id]/page.tsx)
-- ✅ 🔥 Beneficiary: 제안 수락 (status = 'accepted')
-- ✅ 🔥 Beneficiary: 제안 거절 (status = 'rejected')
-- ✅ 🔥 Beneficiary: 수령 확인 (received_at, receipt_photos 업데이트)
-- ✅ 🔥 Beneficiary: 영수증 업로드 (receipt_file_url 업데이트)
-- ✅ Beneficiary: 다른 수혜기관 제안은 안 보임
--
-- [Business - 매칭 조회]
-- ✅ Business: 본인 기부의 매칭 상태 조회 (business/donations/page.tsx)
-- ✅ Business: 어느 수혜기관에게 매칭되었는지 확인
-- ✅ Business: 다른 기업의 매칭은 안 보임
--
-- [Admin - 매칭 관리]
-- ✅ Admin: 견적 발송 상태 변경 (quote_sent_at 업데이트)
-- ✅ Admin: 매칭 상태 관리

-- ============================================================================
-- 성능 주의사항
-- ============================================================================

-- 이미 존재하는 인덱스:
-- ✅ idx_donation_matches_donation_id (donation_id)
-- ✅ idx_donation_matches_beneficiary_id (beneficiary_id)
-- ✅ idx_donation_matches_status (status)
-- ✅ donation_matches_donation_id_beneficiary_id_key (UNIQUE)
--
-- 추가 인덱스 불필요 (이미 최적화됨)

-- ============================================================================
-- 중요: 데이터 무결성 체크
-- ============================================================================

-- 중복 매칭 체크 (UNIQUE 제약으로 자동 방지됨)
SELECT
  donation_id,
  beneficiary_id,
  COUNT(*) as match_count
FROM donation_matches
GROUP BY donation_id, beneficiary_id
HAVING COUNT(*) > 1;
-- 예상 결과: 빈 결과 (중복 없음)

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;

-- 정책 삭제
-- DROP POLICY IF EXISTS "donation_matches_select_own_business" ON donation_matches;
-- DROP POLICY IF EXISTS "donation_matches_select_own_beneficiary" ON donation_matches;
-- DROP POLICY IF EXISTS "donation_matches_select_admin" ON donation_matches;
-- DROP POLICY IF EXISTS "donation_matches_insert_admin" ON donation_matches;
-- DROP POLICY IF EXISTS "donation_matches_update_own_beneficiary" ON donation_matches;
-- DROP POLICY IF EXISTS "donation_matches_update_admin" ON donation_matches;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 3) - 가장 중요!
-- ============================================================================
-- 1. 005_policies_donations.sql 적용 완료 후
-- 2. 이 파일의 Step 1 실행 (정책 생성)
-- 3. 확인 쿼리로 정책 검증 (정책 6개 확인)
-- 4. 인덱스 확인 (이미 존재하는지)
-- 5. UNIQUE 제약 확인
-- 6. ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY 실행
--
-- 🔥 전체 워크플로우 테스트 (순서대로):
-- 7. Business: 기부 등록
-- 8. Admin: 기부 승인
-- 9. Admin: 수혜기관 매칭 (여러 개)
-- 10. Beneficiary: 제안 목록 조회
-- 11. Beneficiary: 제안 수락
-- 12. Admin: 견적서 생성
-- 13. Business: 견적 수락
-- 14. Business: 픽업 일정 등록
-- 15. Beneficiary: 수령 확인 및 영수증 업로드
-- 16. Admin: 완료 처리
--
-- 이 모든 과정이 정상 작동해야 함!
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🔴🔴 매우 높음
-- 예상 소요: 40분 (전체 워크플로우 테스트 포함)
-- 중요도: ⭐⭐⭐⭐⭐⭐ (가장 핵심!)
