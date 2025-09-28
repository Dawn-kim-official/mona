-- 테스트용 donation_match 생성

-- 1. 먼저 기존 데이터 확인
SELECT 
    dm.id,
    dm.donation_id,
    dm.beneficiary_id,
    dm.status,
    d.name as donation_name,
    b.organization_name
FROM donation_matches dm
JOIN donations d ON d.id = dm.donation_id
JOIN beneficiaries b ON b.id = dm.beneficiary_id;

-- 2. 최근 기부와 승인된 수혜기관 확인
SELECT 
    d.id as donation_id,
    d.name,
    d.description,
    d.status,
    d.business_id
FROM donations d
WHERE d.status = 'matched'
ORDER BY d.created_at DESC
LIMIT 5;

SELECT 
    b.id as beneficiary_id,
    b.organization_name,
    b.user_id
FROM beneficiaries b
WHERE b.status = 'approved'
ORDER BY b.created_at DESC
LIMIT 5;

-- 3. 테스트 매칭 생성 (필요한 경우)
-- 아래 쿼리는 실제 donation_id와 beneficiary_id로 교체해서 실행
/*
INSERT INTO donation_matches (
    donation_id,
    beneficiary_id,
    status,
    proposed_by
) VALUES (
    'donation_id_here',  -- 실제 donation ID로 교체
    'beneficiary_id_here',  -- 실제 beneficiary ID로 교체
    'proposed',
    (SELECT id FROM auth.users WHERE email = 'admin@test.com')
);
*/