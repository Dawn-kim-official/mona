-- profiles 테이블에 대한 누락된 정책 추가

-- 1. 사용자가 자신의 프로필을 생성할 수 있도록 허용
CREATE POLICY "Users can insert own profile on signup" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. 서비스 역할이 프로필을 생성할 수 있도록 허용 (트리거용)
CREATE POLICY "Service role can manage profiles" ON profiles
FOR ALL USING (true) WITH CHECK (true);

-- 확인: profiles 테이블의 모든 정책 보기
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';