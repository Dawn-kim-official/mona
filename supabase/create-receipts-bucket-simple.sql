-- 간단한 donation-receipts 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-receipts', 'donation-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 버킷 확인
SELECT * FROM storage.buckets WHERE id = 'donation-receipts';
