-- donation_matches 테이블의 receipt_file_url 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.receipt_issued,
    dm.receipt_issued_at,
    dm.receipt_file_url,
    d.name as donation_name,
    b.name as business_name
FROM donation_matches dm
JOIN donations d ON dm.donation_id = d.id
JOIN businesses b ON d.business_id = b.id
WHERE dm.receipt_issued = true
ORDER BY dm.receipt_issued_at DESC;
