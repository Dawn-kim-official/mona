-- ============================================================================
-- 누락된 Storage Bucket 생성
-- ============================================================================
-- 사용법: Supabase Dashboard → Storage → SQL Editor에서 실행
-- 또는: Dashboard에서 UI로 생성 (더 쉬움)
-- ============================================================================

-- 1. beneficiary-docs 버킷 생성
-- 용도: 수혜기관 회원가입 시 공익법인 설립허가증 업로드
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beneficiary-docs',
  'beneficiary-docs',
  false,  -- private (나중에 RLS 정책 적용)
  10485760,  -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. donation-images 버킷 생성
-- 용도: 수혜기관이 기부 물품 수령 확인 사진 업로드
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-images',
  'donation-images',
  false,  -- private (나중에 RLS 정책 적용)
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 생성 확인
-- ============================================================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('beneficiary-docs', 'donation-images');

-- ============================================================================
-- 참고: UI로 생성하는 방법 (더 쉬움)
-- ============================================================================
-- 1. Supabase Dashboard → Storage
-- 2. "New bucket" 버튼 클릭
-- 3. Bucket name: beneficiary-docs
--    Public: OFF (체크 해제)
--    File size limit: 10 MB
--    Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg
-- 4. Create bucket
-- 5. 반복: donation-images
--    Public: OFF
--    File size limit: 10 MB
--    Allowed MIME types: image/jpeg, image/png, image/jpg, image/gif, image/webp
-- ============================================================================
