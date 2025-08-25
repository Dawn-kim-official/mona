-- 어드민 계정 설정
-- 1. 먼저 일반 회원가입으로 admin@mona.com 계정을 만드세요
-- 2. 그 다음 이 SQL을 실행하세요

-- profiles 테이블에서 admin@mona.com의 role을 admin으로 변경
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@mona.com';

-- 확인
SELECT id, email, role 
FROM profiles 
WHERE email = 'admin@mona.com';