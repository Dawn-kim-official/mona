-- 수혜기관이 자신이 매칭된 기부에 대해 completed 상태로 업데이트할 수 있도록 RLS 정책 추가

-- 기존에 donations 테이블에 RLS가 활성화되어 있는지 확인
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'donations';

-- 수혜기관이 매칭된 기부를 완료 처리할 수 있는 정책 추가
CREATE POLICY "Beneficiaries can mark matched donations as completed"
ON public.donations
FOR UPDATE
TO authenticated
USING (
  -- 현재 사용자가 수혜기관이고, 해당 기부에 대해 accepted 상태의 매칭이 있는 경우
  EXISTS (
    SELECT 1 
    FROM beneficiaries b
    JOIN donation_matches dm ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
    AND dm.donation_id = donations.id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
  )
)
WITH CHECK (
  -- 업데이트할 수 있는 필드는 status와 completed_at만
  status = 'completed'
  AND 
  EXISTS (
    SELECT 1 
    FROM beneficiaries b
    JOIN donation_matches dm ON b.id = dm.beneficiary_id
    WHERE b.user_id = auth.uid()
    AND dm.donation_id = donations.id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
  )
);