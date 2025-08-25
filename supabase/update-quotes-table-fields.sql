-- quotes 테이블에 필요한 필드 추가

-- pickup_time 필드 추가 (이미 있을 수 있음)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'pickup_time'
  ) THEN
    ALTER TABLE quotes ADD COLUMN pickup_time TIME;
  END IF;
END $$;

-- notes 필드 추가 (이미 있을 수 있음)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'notes'
  ) THEN
    ALTER TABLE quotes ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'quotes'
ORDER BY 
  ordinal_position;