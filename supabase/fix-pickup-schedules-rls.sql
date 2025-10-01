-- pickup_schedules 테이블의 RLS 비활성화
ALTER TABLE pickup_schedules DISABLE ROW LEVEL SECURITY;

-- 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pickup_schedules'
ORDER BY ordinal_position;