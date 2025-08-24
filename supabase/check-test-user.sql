-- test@test.com 사용자 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test@test.com';

-- profiles 테이블에서 확인
SELECT * 
FROM profiles 
WHERE email = 'test@test.com';

-- businesses 테이블에서 확인
SELECT b.*, u.email 
FROM businesses b
JOIN auth.users u ON b.user_id = u.id
WHERE u.email = 'test@test.com';