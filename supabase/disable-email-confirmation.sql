-- 개발 환경에서 이메일 인증 없이 사용자 생성을 허용하는 설정
-- 주의: 프로덕션 환경에서는 사용하지 마세요!

-- 모든 신규 사용자를 자동으로 확인된 상태로 만들기
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_users_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_confirm_users();

-- 기존 미확인 사용자들도 확인 처리
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;