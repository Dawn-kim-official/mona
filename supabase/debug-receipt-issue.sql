-- 특정 기부건의 donation_matches 확인
-- donation_id를 실제 값으로 바꿔서 실행하세요
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status,
    dm.receipt_issued,
    dm.receipt_file_url,
    dm.receipt_issued_at,
    d.name as donation_name,
    d.status as donation_status,
    b.name as business_name,
    ben.organization_name
FROM donation_matches dm
JOIN donations d ON dm.donation_id = d.id
JOIN businesses b ON d.business_id = b.id
JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
WHERE d.id = 'YOUR_DONATION_ID_HERE';  -- 여기에 실제 donation_id를 입력하세요