-- 안전하게 beneficiary role 추가하는 방법

-- 1. 현재 enum 값 확인
SELECT enum_range(NULL::user_role);

-- 2. 만약 beneficiary가 이미 있다면 이 쿼리는 실행하지 마세요
-- ALTER TYPE user_role ADD VALUE 'beneficiary';

-- 3. 또는 완전히 새로운 enum을 만들고 교체하는 방법
BEGIN;

-- 새로운 enum 타입 생성
CREATE TYPE user_role_new AS ENUM ('business', 'admin', 'beneficiary');

-- 기존 컬럼의 타입을 변경
ALTER TABLE profiles 
    ALTER COLUMN role TYPE user_role_new 
    USING role::text::user_role_new;

-- 기존 enum 삭제
DROP TYPE user_role;

-- 새 enum의 이름을 기존 이름으로 변경
ALTER TYPE user_role_new RENAME TO user_role;

COMMIT;

-- 확인
SELECT enum_range(NULL::user_role);