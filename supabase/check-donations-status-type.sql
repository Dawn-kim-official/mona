-- donations 테이블의 status 컬럼 타입 확인

-- 1. 컬럼 정보 확인
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'donations' 
  AND column_name = 'status'
  AND table_schema = 'public';

-- 2. enum 타입인 경우 값 확인
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'donation_status'
ORDER BY e.enumsortorder;

-- 3. 체크 제약조건 확인
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'donations'
    AND con.contype = 'c';

-- 4. 현재 donations 테이블에 있는 고유한 status 값들 확인
SELECT DISTINCT status 
FROM donations 
ORDER BY status;