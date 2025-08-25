-- donation-receipts 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-receipts',
  'donation-receipts',
  true,  -- public 버킷으로 설정
  10485760,  -- 10MB 제한
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 설정
-- 1. 인증된 사용자는 업로드 가능
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
USING (bucket_id = 'donation-receipts');

-- 2. 모든 사용자가 읽기 가능 (public 버킷)
CREATE POLICY "Anyone can view receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'donation-receipts');

-- 3. 업로드한 사용자는 삭제 가능
CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'donation-receipts' AND auth.uid()::text = owner);

-- 버킷 생성 확인
SELECT * FROM storage.buckets WHERE id = 'donation-receipts';