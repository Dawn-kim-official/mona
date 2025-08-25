-- 1. 기존 테이블 삭제 (주의: 기존 데이터가 있다면 백업 필요)
DROP TABLE IF EXISTS quotes CASCADE;

-- 2. quotes 테이블 생성
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  unit_price INTEGER,
  logistics_cost INTEGER,
  total_amount INTEGER,
  estimated_pickup_date DATE,
  pickup_time TEXT,
  special_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 비활성화
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- 4. 테이블이 생성되었는지 확인
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