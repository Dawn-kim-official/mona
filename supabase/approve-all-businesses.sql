-- 모든 비즈니스 자동 승인 처리

-- 1. 모든 비즈니스를 승인 상태로 변경
UPDATE businesses 
SET 
    status = 'approved',
    contract_signed = true,
    approved_at = COALESCE(approved_at, NOW())
WHERE status != 'approved';

-- 2. 결과 확인
SELECT 
    b.id,
    b.name,
    b.email,
    b.status,
    b.approved_at,
    u.email as user_email
FROM businesses b
JOIN auth.users u ON b.user_id = u.id
ORDER BY b.created_at DESC;

-- 3. 승인 처리된 비즈니스 수 확인
SELECT 
    COUNT(*) as total_businesses,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_businesses
FROM businesses;