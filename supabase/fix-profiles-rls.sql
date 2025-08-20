-- profiles 테이블에 INSERT 정책 추가
CREATE POLICY "Enable insert for authenticated users only" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 또는 트리거가 작동하지 않는 경우, 수동으로 INSERT 허용
CREATE POLICY "Service role can insert profiles" ON profiles
FOR INSERT WITH CHECK (true);

-- 트리거 재생성 (필요한 경우)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();