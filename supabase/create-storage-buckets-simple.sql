-- 스토리지 버킷 생성 (간단 버전)
-- Supabase Dashboard > SQL Editor에서 실행

-- 기존 버킷 확인
SELECT * FROM storage.buckets;

-- 버킷이 없으면 생성
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('business-licenses', 'business-licenses', true),
    ('donation-photos', 'donation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS 비활성화 (개발용)
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('business-licenses', 'donation-photos');

-- 확인
SELECT * FROM storage.buckets;