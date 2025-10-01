-- pickup_scheduled 상태인 기부들 중 픽업 일정이 있는 것들을 pickup_coordinating으로 되돌리기
-- (어드민에서 수동으로 "일정 확정" 버튼을 눌러야 pickup_scheduled가 되도록)

-- 먼저 현재 상황 확인
SELECT d.id, d.status, ps.pickup_date, ps.pickup_time, ps.status as schedule_status
FROM donations d
LEFT JOIN pickup_schedules ps ON d.id = ps.donation_id
WHERE d.status IN ('pickup_coordinating', 'pickup_scheduled');

-- pickup_scheduled 상태이면서 픽업 일정이 있는 기부들을 pickup_coordinating으로 되돌리기
-- (어드민이 수동으로 확정해야 함)
UPDATE donations 
SET status = 'pickup_coordinating'
WHERE status = 'pickup_scheduled' 
  AND id IN (
    SELECT DISTINCT donation_id 
    FROM pickup_schedules 
    WHERE status = 'scheduled'
  );

-- 업데이트 결과 확인
SELECT d.id, d.status, ps.pickup_date, ps.pickup_time, ps.status as schedule_status
FROM donations d
LEFT JOIN pickup_schedules ps ON d.id = ps.donation_id
WHERE d.status IN ('pickup_coordinating', 'pickup_scheduled');