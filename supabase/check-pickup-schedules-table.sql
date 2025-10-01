-- pickup_schedules 테이블 존재 여부 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'pickup_schedules'
) as table_exists;

-- pickup_schedules 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pickup_schedules'
ORDER BY ordinal_position;

-- pickup_schedules 테이블의 제약조건 확인
SELECT
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause,
    kcu.column_name
FROM 
    information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pickup_schedules'
ORDER BY tc.constraint_type;

-- pickup_schedules 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS pickup_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    pickup_date DATE NOT NULL,
    pickup_time TEXT NOT NULL,
    pickup_staff TEXT NOT NULL,
    vehicle_info TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 비활성화
ALTER TABLE pickup_schedules DISABLE ROW LEVEL SECURITY;

-- 현재 데이터 확인
SELECT * FROM pickup_schedules;