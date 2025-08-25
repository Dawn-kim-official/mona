-- donations 테이블의 status enum에 'beneficiary_selected' 추가
-- 먼저 현재 enum 값들 확인
SELECT unnest(enum_range(NULL::donation_status));

-- 새로운 enum 값 추가
-- PostgreSQL에서는 enum에 값을 추가할 때 AFTER 절을 사용할 수 없으므로 단순히 추가
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'beneficiary_selected';