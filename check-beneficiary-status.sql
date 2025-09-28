-- beneficiaries 테이블에 status 컬럼이 있는지 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'beneficiaries'
  AND column_name = 'status';

-- status 컬럼이 없으면 추가
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 기존 레코드가 있다면 status 업데이트
UPDATE beneficiaries 
SET status = 'approved' 
WHERE status IS NULL;