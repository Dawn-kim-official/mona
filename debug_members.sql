-- 어드민 회원관리 디버깅 쿼리

-- 1. businesses 테이블 데이터 확인
SELECT 
    count(*) as total_businesses,
    count(CASE WHEN status = 'pending' THEN 1 END) as pending_businesses,
    count(CASE WHEN status = 'approved' THEN 1 END) as approved_businesses
FROM businesses;

-- 2. beneficiaries 테이블 데이터 확인  
SELECT 
    count(*) as total_beneficiaries,
    count(CASE WHEN status = 'pending' THEN 1 END) as pending_beneficiaries,
    count(CASE WHEN status = 'approved' THEN 1 END) as approved_beneficiaries
FROM beneficiaries;

-- 3. 최근 businesses 목록 (5개)
SELECT id, name, email, status, created_at 
FROM businesses 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. 최근 beneficiaries 목록 (5개)
SELECT id, organization_name, email, status, created_at 
FROM beneficiaries 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Service Role Key 환경변수 확인을 위한 임시 쿼리
-- (실제 운영에서는 사용하지 말 것)
SELECT current_setting('app.supabase_service_role_key', true) as service_key;