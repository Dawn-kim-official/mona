-- donations 테이블의 status 컬럼 제약조건 확인
SELECT
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM 
    information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'donations' AND tc.constraint_type = 'CHECK';

-- donations 테이블의 현재 status 값들 확인
SELECT DISTINCT status FROM donations ORDER BY status;

-- donations 테이블의 status 컬럼 정보
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'donations' AND column_name = 'status';