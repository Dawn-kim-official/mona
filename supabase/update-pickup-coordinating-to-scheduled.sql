-- pickup_coordinating 상태를 pickup_scheduled로 업데이트
-- (어드민에서 픽업 일정을 설정하면 바로 pickup_scheduled가 되도록 변경했으므로)

-- 현재 pickup_coordinating 상태인 기부 확인
SELECT id, name, status, updated_at
FROM donations  
WHERE status = 'pickup_coordinating';

-- pickup_coordinating을 pickup_scheduled로 업데이트
UPDATE donations
SET status = 'pickup_scheduled',
    updated_at = NOW()
WHERE status = 'pickup_coordinating';

-- 업데이트 결과 확인
SELECT id, name, status, updated_at
FROM donations
WHERE status = 'pickup_scheduled'
AND updated_at > NOW() - INTERVAL '1 minute';