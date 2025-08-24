-- test@test.com 사용자의 비밀번호를 123123으로 재설정
UPDATE auth.users 
SET 
  encrypted_password = crypt('123123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'test@test.com';

-- 확인
SELECT id, email, updated_at 
FROM auth.users 
WHERE email = 'test@test.com';