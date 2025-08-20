-- 테이블 존재 여부 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- profiles 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- auth.users 테이블 확인 (사용자가 생성되었는지)
SELECT id, email, created_at 
FROM auth.users 
LIMIT 10;

-- profiles 테이블 데이터 확인
SELECT * FROM profiles LIMIT 10;