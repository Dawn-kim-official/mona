-- donations 테이블의 status enum에 'rejected' 추가

-- 1. 현재 enum 값 확인
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'donation_status'
GROUP BY t.typname;

-- 2. 'rejected' 값이 없으면 추가
-- 'pending_review' 다음에 'rejected' 추가
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'rejected' AFTER 'pending_review';

-- 3. 추가 확인
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'donation_status'
ORDER BY e.enumsortorder;