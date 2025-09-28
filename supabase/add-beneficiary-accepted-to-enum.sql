-- donations 테이블의 status enum 타입에 'beneficiary_accepted' 추가

-- 1. 현재 enum 값 확인
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'donation_status'
GROUP BY t.typname;

-- 2. enum에 새 값 추가
-- PostgreSQL 9.1 이상에서는 ALTER TYPE을 사용
BEGIN;

-- 'matched' 다음에 'beneficiary_accepted' 추가
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'beneficiary_accepted' AFTER 'matched';

COMMIT;

-- 3. 추가 확인
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'donation_status'
ORDER BY e.enumsortorder;