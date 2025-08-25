-- Admin이 beneficiaries 테이블에 접근할 수 있도록 수정

-- 1. 현재 admin 사용자 확인
SELECT 
  u.id,
  u.email,
  p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin';

-- 2. 기존 admin 정책 삭제
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can update beneficiary status" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can do everything" ON beneficiaries;
DROP POLICY IF EXISTS "Admins can do all" ON beneficiaries;

-- 3. 새로운 admin 정책 생성 (더 간단하게)
CREATE POLICY "Enable read access for admins" ON beneficiaries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins" ON beneficiaries
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins" ON beneficiaries
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- 4. 테스트 - admin으로 로그인한 상태에서 실행
SELECT COUNT(*) FROM beneficiaries;