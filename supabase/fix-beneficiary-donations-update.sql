-- 수혜기관이 donations 테이블을 업데이트할 수 있도록 RLS 정책 수정

-- 현재 donations 테이블의 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'donations';

-- 기존의 제한적인 정책이 있다면 삭제하고 새로 만들기
-- (먼저 어떤 정책들이 있는지 확인 후 진행)

-- 수혜기관이 자신과 매칭된 기부를 completed로 업데이트할 수 있는 정책 추가
CREATE POLICY "beneficiaries_can_complete_donations" ON "public"."donations"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM beneficiaries b
    JOIN donation_matches dm ON b.id = dm.beneficiary_id  
    WHERE b.user_id = auth.uid()
    AND dm.donation_id = donations.id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
  )
)
WITH CHECK (
  -- completed 상태로만 변경 가능
  status = 'completed'
);

-- 또는 임시로 모든 authenticated 사용자가 donations를 업데이트할 수 있게 하기
-- (보안상 권장하지 않음, 테스트용)
-- CREATE POLICY "temp_allow_all_updates" ON "public"."donations"
-- AS PERMISSIVE FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);