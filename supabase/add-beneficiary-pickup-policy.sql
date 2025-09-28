-- Policy for beneficiaries to view pickup schedules for their matched donations
CREATE POLICY "Beneficiaries can view pickup schedules for their donations" ON pickup_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM donation_matches dm
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE dm.donation_id = pickup_schedules.donation_id
    AND dm.status IN ('accepted', 'quote_sent', 'received')
    AND b.user_id = auth.uid()
  )
);