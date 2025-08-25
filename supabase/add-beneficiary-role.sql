-- 먼저 현재 enum 값 확인
SELECT enum_range(NULL::user_role);

-- beneficiary가 없다면 추가
ALTER TYPE user_role ADD VALUE 'beneficiary';

-- 추가 후 확인
SELECT enum_range(NULL::user_role);