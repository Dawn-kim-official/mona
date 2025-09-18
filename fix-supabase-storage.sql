-- Supabase Storage 버킷 생성 및 권한 설정

-- 1. donation-photos 버킷이 없으면 생성 (Supabase 대시보드에서 수동으로 생성 필요)
-- Storage > New bucket > Name: donation-photos, Public: true

-- 2. Storage 정책 설정 (RLS)
-- 이미 버킷이 생성되어 있다면, 아래 정책들을 추가

-- 모든 사용자가 이미지를 볼 수 있도록 설정
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'donation-photos');

-- 인증된 사용자는 업로드 가능
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'donation-photos' AND auth.role() = 'authenticated'
);

-- 자신이 업로드한 이미지는 수정 가능
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'donation-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 자신이 업로드한 이미지는 삭제 가능  
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (
  bucket_id = 'donation-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- donation-images 버킷도 동일하게 설정
CREATE POLICY "Public Access for donation-images" ON storage.objects FOR SELECT USING (bucket_id = 'donation-images');

CREATE POLICY "Authenticated users can upload to donation-images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'donation-images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own donation-images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'donation-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own donation-images" ON storage.objects FOR DELETE USING (
  bucket_id = 'donation-images' AND auth.uid()::text = (storage.foldername(name))[1]
);