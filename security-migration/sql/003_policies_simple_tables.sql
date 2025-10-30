-- ============================================================================
-- RLS Policies: reports, notifications 테이블
-- ============================================================================
-- 목적: ESG 리포트 관리, 시스템 알림
-- 난이도: 🟢 쉬움
-- 정책 수: 9개 (reports 4개 + notifications 5개)
-- ============================================================================

-- ============================================================================
-- reports 테이블 (ESG 리포트)
-- ============================================================================
-- - Admin이 업로드/삭제
-- - Business는 본인 리포트만 조회

-- 정책 1: Business가 본인 리포트 읽기
CREATE POLICY "reports_select_own_business"
ON reports
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);

-- 정책 2: Admin이 모든 리포트 읽기
CREATE POLICY "reports_select_admin"
ON reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Admin이 리포트 생성
CREATE POLICY "reports_insert_admin"
ON reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Admin이 리포트 삭제
CREATE POLICY "reports_delete_admin"
ON reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- notifications 테이블 (알림)
-- ============================================================================
-- - 본인 알림만 조회/수정/삭제
-- - Business/Admin이 알림 생성

-- 정책 1: 본인 알림 읽기
CREATE POLICY "notifications_select_own"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 정책 2: Business가 알림 생성 (픽업 스케줄 등)
CREATE POLICY "notifications_insert_business"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN businesses b ON p.id = b.user_id
    WHERE p.id = auth.uid()
  )
);

-- 정책 3: Admin이 알림 생성
CREATE POLICY "notifications_insert_admin"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: 본인 알림 수정 (읽음 표시)
CREATE POLICY "notifications_update_own"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 정책 5: 본인 알림 삭제
CREATE POLICY "notifications_delete_own"
ON notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- Step 2: RLS 활성화 (정책 생성 후 실행)
-- ============================================================================

-- ⚠️ 주의: 이 명령은 정책이 모두 생성된 후에 실행하세요!
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- reports 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'reports'
ORDER BY policyname;

-- notifications 정책 확인
SELECT
  tablename,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('reports', 'notifications');

-- ============================================================================
-- 간단 테스트 (RLS 활성화 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [reports]
-- ✅ Admin: ESG 리포트 업로드 (admin/reports/page.tsx)
-- ✅ Admin: 리포트 목록 조회
-- ✅ Admin: 리포트 삭제
-- ✅ Business: 본인 리포트 조회 (business/dashboard/page.tsx)
-- ✅ Business: 다른 기업 리포트는 안 보임
--
-- [notifications]
-- ✅ Business: 픽업 스케줄 등록 시 알림 생성
-- ✅ 사용자: 본인 알림 조회
-- ✅ 사용자: 알림 읽음 표시
-- ✅ 사용자: 다른 사람 알림은 안 보임

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- RLS 비활성화
-- ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- reports 정책 삭제
-- DROP POLICY IF EXISTS "reports_select_own_business" ON reports;
-- DROP POLICY IF EXISTS "reports_select_admin" ON reports;
-- DROP POLICY IF EXISTS "reports_insert_admin" ON reports;
-- DROP POLICY IF EXISTS "reports_delete_admin" ON reports;

-- notifications 정책 삭제
-- DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
-- DROP POLICY IF EXISTS "notifications_insert_business" ON notifications;
-- DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
-- DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
-- DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 1)
-- ============================================================================
-- 1. 002_policies_profiles.sql 적용 완료 후
-- 2. 이 파일의 Step 1 실행 (정책 생성)
-- 3. 확인 쿼리로 정책 검증
-- 4. ALTER TABLE ... ENABLE ROW LEVEL SECURITY 실행
-- 5. 앱에서 기능 테스트
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🟢 쉬움
-- 예상 소요: 15분
