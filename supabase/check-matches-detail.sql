-- donation_matches 상세 데이터 확인

-- 1. 모든 매칭 데이터 상세 조회
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status,
    dm.proposed_at,
    dm.responded_at,
    d.name as donation_name,
    d.description as donation_desc,
    d.status as donation_status,
    b.organization_name,
    b.user_id as beneficiary_user_id,
    u.email as beneficiary_email
FROM donation_matches dm
LEFT JOIN donations d ON d.id = dm.donation_id
LEFT JOIN beneficiaries b ON b.id = dm.beneficiary_id
LEFT JOIN auth.users u ON u.id = b.user_id
ORDER BY dm.created_at DESC;

-- 2. 각 상태별 카운트
SELECT 
    status,
    COUNT(*) as count
FROM donation_matches
GROUP BY status
ORDER BY status;

-- 3. 수혜기관별 매칭 수
SELECT 
    b.organization_name,
    b.user_id,
    COUNT(dm.id) as match_count
FROM beneficiaries b
LEFT JOIN donation_matches dm ON dm.beneficiary_id = b.id
WHERE b.status = 'approved'
GROUP BY b.id, b.organization_name, b.user_id
ORDER BY match_count DESC;