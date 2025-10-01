-- 수혜기관이 수령 완료 시 자동으로 donations 테이블을 completed로 업데이트할 수 있도록 허용

-- 기존 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'donations';

-- 수혜기관이 매칭된 기부를 completed로 업데이트할 수 있는 정책 생성
DROP POLICY IF EXISTS "beneficiaries_can_complete_donations" ON "public"."donations";

CREATE POLICY "beneficiaries_can_complete_donations" ON "public"."donations"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  -- 현재 사용자가 수혜기관이고, 해당 기부에 대해 매칭이 있는 경우
  EXISTS (
    SELECT 1 FROM beneficiaries b
    JOIN donation_matches dm ON b.id = dm.beneficiary_id  
    WHERE b.user_id = auth.uid()
    AND dm.donation_id = donations.id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
  )
)
WITH CHECK (
  -- completed 상태로 변경하는 경우만 허용
  status = 'completed'
  AND
  EXISTS (
    SELECT 1 FROM beneficiaries b
    JOIN donation_matches dm ON b.id = dm.beneficiary_id  
    WHERE b.user_id = auth.uid()
    AND dm.donation_id = donations.id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
  )
);