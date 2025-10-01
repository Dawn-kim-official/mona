-- 현재 donation_status ENUM의 허용된 값들 확인
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'donation_status'
)
ORDER BY enumsortorder;

-- pickup_coordinating 값을 ENUM에 추가
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'pickup_coordinating';

-- pickup_scheduled 값도 추가 (혹시 없다면)
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'pickup_scheduled';

-- 다시 확인
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'donation_status'
)
ORDER BY enumsortorder;