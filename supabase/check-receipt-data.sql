-- 기부 정보 확인
SELECT 
    d.id,
    d.name,
    d.status as donation_status,
    d.business_id,
    b.name as business_name
FROM donations d
JOIN businesses b ON d.business_id = b.id
WHERE d.status = 'completed'
ORDER BY d.created_at DESC;

-- donation_matches 테이블 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status as match_status,
    dm.receipt_issued,
    dm.receipt_issued_at,
    dm.receipt_file_url,
    dm.accepted_quantity,
    d.name as donation_name,
    d.status as donation_status,
    ben.organization_name
FROM donation_matches dm
JOIN donations d ON dm.donation_id = d.id
JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
WHERE d.status = 'completed'
ORDER BY dm.created_at DESC;

-- receipt_issued가 true인 매칭 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.receipt_issued,
    dm.receipt_file_url,
    d.name as donation_name,
    d.status as donation_status,
    b.name as business_name
FROM donation_matches dm
JOIN donations d ON dm.donation_id = d.id
JOIN businesses b ON d.business_id = b.id
WHERE dm.receipt_issued = true
ORDER BY dm.receipt_issued_at DESC;