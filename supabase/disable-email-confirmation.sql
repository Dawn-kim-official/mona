-- 개발 환경에서 이메일 확인 없이 바로 사용할 수 있도록 설정
-- 주의: 프로덕션에서는 사용하지 마세요!

-- 새로 생성된 사용자를 자동으로 확인된 상태로 만들기
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 모든 사용자 확인
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;