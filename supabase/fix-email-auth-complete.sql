-- 수혜기관 회원가입 문제 완전 해결

-- 1. profiles 테이블에 INSERT 정책 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. beneficiaries 테이블에 INSERT 정책 확인 (add-beneficiary-tables.sql에서 이미 생성했지만 확인)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'beneficiaries' 
    AND policyname = 'Anyone can insert beneficiary'
  ) THEN
    -- 이미 있어야 하지만 혹시 없으면 추가
    CREATE POLICY "Anyone can insert beneficiary" ON beneficiaries
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. 모든 미확인 사용자를 확인 처리 (개발 환경용)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. 자동 이메일 확인 트리거 생성 (없으면)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- 자동으로 이메일 확인
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_email_confirm'
  ) THEN
    CREATE TRIGGER on_auth_user_created_email_confirm
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 5. 확인
SELECT 
  'Policies for profiles:' as info,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 
  'Policies for beneficiaries:' as info,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'beneficiaries';

-- 6. user_role enum 확인
SELECT enum_range(NULL::user_role);