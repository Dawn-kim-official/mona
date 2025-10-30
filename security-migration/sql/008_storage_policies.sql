-- ============================================================================
-- Storage Bucket RLS Policies
-- ============================================================================
-- 목적: 파일 업로드/다운로드 권한 관리
-- 난이도: 🟡 중간
-- 버킷 수: 7개
-- ============================================================================

-- 🔥 핵심:
-- 1. Business: 본인 사업자등록증, 기부 사진 업로드
-- 2. Beneficiary: 본인 서류, 수령 영수증 업로드
-- 3. Admin: ESG 리포트 업로드, 모든 파일 조회
-- 4. 각 역할별 업로드 경로 제한 (user_id 기반)

-- ============================================================================
-- business-licenses 버킷 (사업자등록증)
-- ============================================================================
-- 경로 형식: {user_id}/business-license.pdf
-- Business: 본인 파일 업로드/조회/삭제
-- Admin: 모든 파일 조회

-- 정책 1: Business가 본인 사업자등록증 조회
CREATE POLICY "business_licenses_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 2: Admin이 모든 사업자등록증 조회
CREATE POLICY "business_licenses_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Business가 본인 사업자등록증 업로드
CREATE POLICY "business_licenses_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 4: Business가 본인 사업자등록증 삭제
CREATE POLICY "business_licenses_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-licenses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- beneficiary-docs 버킷 (수혜기관 서류)
-- ============================================================================
-- 경로 형식: {user_id}/document.pdf
-- Beneficiary: 본인 서류 업로드/조회/삭제
-- Admin: 모든 서류 조회

-- 정책 1: Beneficiary가 본인 서류 조회
CREATE POLICY "beneficiary_docs_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'beneficiary-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 2: Admin이 모든 수혜기관 서류 조회
CREATE POLICY "beneficiary_docs_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'beneficiary-docs'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Beneficiary가 본인 서류 업로드
CREATE POLICY "beneficiary_docs_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'beneficiary-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 4: Beneficiary가 본인 서류 삭제
CREATE POLICY "beneficiary_docs_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'beneficiary-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- donation-photos 버킷 (기부 사진)
-- ============================================================================
-- 경로 형식: {donation_id}/photo-{timestamp}.jpg
-- Business: 본인 기부 사진 업로드/조회/삭제
-- Admin: 모든 사진 조회
-- Beneficiary: 매칭된 기부 사진 조회

-- 정책 1: Business가 본인 기부 사진 조회
CREATE POLICY "donation_photos_select_own_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Admin이 모든 기부 사진 조회
CREATE POLICY "donation_photos_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Beneficiary가 매칭된 기부 사진 조회
CREATE POLICY "donation_photos_select_matched_beneficiary"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 4: Business가 본인 기부 사진 업로드
CREATE POLICY "donation_photos_insert_own_business"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 5: Business가 본인 기부 사진 삭제
CREATE POLICY "donation_photos_delete_own_business"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================================================
-- donation-images 버킷 (기부 이미지 - 상세 페이지)
-- ============================================================================
-- 경로 형식: {donation_id}/image-{timestamp}.jpg
-- Business: 본인 기부 이미지 업로드/조회/삭제
-- Admin: 모든 이미지 조회
-- Beneficiary: 매칭된 기부 이미지 조회

-- 정책 1: Business가 본인 기부 이미지 조회
CREATE POLICY "donation_images_select_own_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Admin이 모든 기부 이미지 조회
CREATE POLICY "donation_images_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Beneficiary가 매칭된 기부 이미지 조회
CREATE POLICY "donation_images_select_matched_beneficiary"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.donation_id
    FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 4: Business가 본인 기부 이미지 업로드
CREATE POLICY "donation_images_insert_own_business"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 5: Business가 본인 기부 이미지 삭제
CREATE POLICY "donation_images_delete_own_business"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-images'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================================================
-- donation-receipts 버킷 (수령 영수증)
-- ============================================================================
-- 경로 형식: {donation_match_id}/receipt-{timestamp}.jpg
-- Beneficiary: 매칭된 기부 영수증 업로드/조회
-- Business: 본인 기부의 영수증 조회
-- Admin: 모든 영수증 조회

-- 정책 1: Beneficiary가 본인 매칭 영수증 조회
CREATE POLICY "donation_receipts_select_own_beneficiary"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-receipts'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Business가 본인 기부의 영수증 조회
CREATE POLICY "donation_receipts_select_own_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-receipts'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.id FROM donation_matches dm
    JOIN donations d ON dm.donation_id = d.id
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 3: Admin이 모든 영수증 조회
CREATE POLICY "donation_receipts_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-receipts'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Beneficiary가 본인 매칭 영수증 업로드
CREATE POLICY "donation_receipts_insert_own_beneficiary"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-receipts'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 5: Beneficiary가 본인 매칭 영수증 삭제
CREATE POLICY "donation_receipts_delete_own_beneficiary"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-receipts'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================================================
-- esg-reports 버킷 (ESG 리포트)
-- ============================================================================
-- 경로 형식: {business_id}/report-{year}-{quarter}.pdf
-- Admin: 리포트 업로드/삭제
-- Business: 본인 리포트 조회
-- Admin: 모든 리포트 조회

-- 정책 1: Business가 본인 ESG 리포트 조회
CREATE POLICY "esg_reports_select_own_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'esg-reports'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT b.id FROM businesses b
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Admin이 모든 ESG 리포트 조회
CREATE POLICY "esg_reports_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'esg-reports'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 3: Admin이 ESG 리포트 업로드
CREATE POLICY "esg_reports_insert_admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'esg-reports'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Admin이 ESG 리포트 삭제
CREATE POLICY "esg_reports_delete_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'esg-reports'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- post-donation-media 버킷 (기부 후 사진)
-- ============================================================================
-- 경로 형식: {donation_id}/post-{timestamp}.jpg
-- Beneficiary: 매칭된 기부의 사후 사진 업로드/조회
-- Business: 본인 기부의 사후 사진 조회
-- Admin: 모든 사진 조회

-- 정책 1: Beneficiary가 매칭된 기부의 사후 사진 조회
CREATE POLICY "post_donation_media_select_own_beneficiary"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-donation-media'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.donation_id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 2: Business가 본인 기부의 사후 사진 조회
CREATE POLICY "post_donation_media_select_own_business"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-donation-media'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT d.id FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 3: Admin이 모든 사후 사진 조회
CREATE POLICY "post_donation_media_select_admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-donation-media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 정책 4: Beneficiary가 매칭된 기부의 사후 사진 업로드
CREATE POLICY "post_donation_media_insert_own_beneficiary"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-donation-media'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.donation_id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- 정책 5: Beneficiary가 매칭된 기부의 사후 사진 삭제
CREATE POLICY "post_donation_media_delete_own_beneficiary"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-donation-media'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT dm.donation_id FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================================================
-- Step 2: 확인 쿼리
-- ============================================================================

-- 모든 storage 정책 확인
SELECT
  policyname,
  cmd,
  LEFT(qual::text, 100) as using_clause_preview
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- 버킷별 정책 개수 확인
SELECT
  SUBSTRING(policyname FROM '^[^_]+') as bucket_prefix,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
GROUP BY SUBSTRING(policyname FROM '^[^_]+')
ORDER BY bucket_prefix;

-- 예상 결과:
-- business_licenses: 4 policies
-- beneficiary_docs: 4 policies
-- donation_photos: 5 policies
-- donation_images: 5 policies
-- donation_receipts: 5 policies
-- esg_reports: 4 policies
-- post_donation_media: 5 policies
-- Total: 32 policies

-- ============================================================================
-- 간단 테스트 (정책 생성 후)
-- ============================================================================

-- 앱에서 다음 기능들이 정상 작동하는지 확인:
--
-- [business-licenses]
-- ✅ Business: 사업자등록증 업로드 (signup/page.tsx)
-- ✅ Business: 본인 사업자등록증 조회 (business/profile/page.tsx)
-- ✅ Admin: 모든 사업자등록증 조회 (admin/businesses/page.tsx)
-- ✅ Business: 다른 기업 사업자등록증은 안 보임
--
-- [beneficiary-docs]
-- ✅ Beneficiary: 서류 업로드 (signup/page.tsx)
-- ✅ Beneficiary: 본인 서류 조회 (beneficiary/profile/page.tsx)
-- ✅ Admin: 모든 수혜기관 서류 조회 (admin/businesses/page.tsx)
-- ✅ Beneficiary: 다른 수혜기관 서류는 안 보임
--
-- [donation-photos & donation-images]
-- ✅ Business: 기부 등록 시 사진 업로드 (business/donation/new/page.tsx)
-- ✅ Business: 본인 기부 사진 조회 (business/donation/[id]/page.tsx)
-- ✅ Beneficiary: 매칭된 기부 사진 조회 (beneficiary/proposal/[id]/page.tsx)
-- ✅ Admin: 모든 기부 사진 조회 (admin/donation/[id]/detail/page.tsx)
-- ✅ Business: 다른 기업 기부 사진은 안 보임
--
-- [donation-receipts]
-- ✅ Beneficiary: 수령 영수증 업로드 (beneficiary/proposal/[id]/receipt/page.tsx)
-- ✅ Beneficiary: 본인 영수증 조회
-- ✅ Business: 본인 기부의 영수증 조회 (business/donation/[id]/page.tsx)
-- ✅ Admin: 모든 영수증 조회
-- ✅ Beneficiary: 다른 수혜기관 영수증은 안 보임
--
-- [esg-reports]
-- ✅ Admin: ESG 리포트 업로드 (admin/reports/page.tsx)
-- ✅ Business: 본인 ESG 리포트 조회 (business/dashboard/page.tsx)
-- ✅ Admin: 모든 ESG 리포트 조회
-- ✅ Business: 다른 기업 ESG 리포트는 안 보임
--
-- [post-donation-media]
-- ✅ Beneficiary: 기부 수령 후 사진 업로드 (beneficiary/proposal/[id]/complete/page.tsx)
-- ✅ Business: 본인 기부의 사후 사진 조회 (business/donation/[id]/history/page.tsx)
-- ✅ Admin: 모든 사후 사진 조회
-- ✅ Beneficiary: 다른 수혜기관 사진은 안 보임

-- ============================================================================
-- 롤백 (문제 발생 시)
-- ============================================================================

-- business-licenses 정책 삭제
-- DROP POLICY IF EXISTS "business_licenses_select_own" ON storage.objects;
-- DROP POLICY IF EXISTS "business_licenses_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "business_licenses_insert_own" ON storage.objects;
-- DROP POLICY IF EXISTS "business_licenses_delete_own" ON storage.objects;

-- beneficiary-docs 정책 삭제
-- DROP POLICY IF EXISTS "beneficiary_docs_select_own" ON storage.objects;
-- DROP POLICY IF EXISTS "beneficiary_docs_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "beneficiary_docs_insert_own" ON storage.objects;
-- DROP POLICY IF EXISTS "beneficiary_docs_delete_own" ON storage.objects;

-- donation-photos 정책 삭제
-- DROP POLICY IF EXISTS "donation_photos_select_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_photos_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_photos_select_matched_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_photos_insert_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_photos_delete_own_business" ON storage.objects;

-- donation-images 정책 삭제
-- DROP POLICY IF EXISTS "donation_images_select_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_images_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_images_select_matched_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_images_insert_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_images_delete_own_business" ON storage.objects;

-- donation-receipts 정책 삭제
-- DROP POLICY IF EXISTS "donation_receipts_select_own_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_receipts_select_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_receipts_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_receipts_insert_own_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "donation_receipts_delete_own_beneficiary" ON storage.objects;

-- esg-reports 정책 삭제
-- DROP POLICY IF EXISTS "esg_reports_select_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "esg_reports_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "esg_reports_insert_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "esg_reports_delete_admin" ON storage.objects;

-- post-donation-media 정책 삭제
-- DROP POLICY IF EXISTS "post_donation_media_select_own_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "post_donation_media_select_own_business" ON storage.objects;
-- DROP POLICY IF EXISTS "post_donation_media_select_admin" ON storage.objects;
-- DROP POLICY IF EXISTS "post_donation_media_insert_own_beneficiary" ON storage.objects;
-- DROP POLICY IF EXISTS "post_donation_media_delete_own_beneficiary" ON storage.objects;

-- ============================================================================
-- 적용 순서 (Phase 4 Day 4)
-- ============================================================================
-- 1. 007_policies_quotes_pickup.sql 적용 완료 후
-- 2. 이 파일 실행 (storage 정책 생성)
-- 3. 확인 쿼리로 정책 검증 (총 32개)
-- 4. 버킷별로 앱에서 기능 테스트
-- 5. 각 역할(business/beneficiary/admin)로 로그인해서 파일 업로드/조회 테스트
-- ============================================================================

-- 생성일: 2025-10-30
-- 작성: Claude Code
-- 난이도: 🟡 중간
-- 예상 소요: 30분
-- 중요도: ⭐⭐⭐⭐ (파일 보안 핵심!)
