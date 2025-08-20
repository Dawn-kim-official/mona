-- 1. 모든 트리거와 함수 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. 확인
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 3. auth.users 테이블에서 기존 사용자 확인
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. profiles 테이블 확인
SELECT * FROM profiles;

-- 5. 테스트용 사용자 직접 생성 (Dashboard 사용 불가 시)
-- 아래는 서비스 역할 키로만 실행 가능합니다