-- donations 테이블의 status 체크 제약조건에 'beneficiary_accepted' 추가

-- 먼저 현재 체크 제약조건 확인
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'donations'
    AND con.contype = 'c'
    AND nsp.nspname = 'public';

-- 기존 체크 제약 조건 제거
ALTER TABLE donations 
DROP CONSTRAINT IF EXISTS donations_status_check;

-- 새로운 체크 제약 조건 추가 (beneficiary_accepted 포함)
ALTER TABLE donations 
ADD CONSTRAINT donations_status_check 
CHECK (status IN (
    'pending_review', 
    'rejected', 
    'matched', 
    'beneficiary_accepted',
    'quote_sent', 
    'quote_accepted', 
    'pickup_scheduled', 
    'completed'
));

-- 확인
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'donations'
    AND con.contype = 'c'
    AND nsp.nspname = 'public';