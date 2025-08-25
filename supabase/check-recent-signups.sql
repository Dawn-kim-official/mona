-- 최근 생성된 사용자 확인
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.role,
  b.organization_name,
  b.status as beneficiary_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN beneficiaries b ON u.id = b.user_id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;

-- profiles 테이블 확인
SELECT COUNT(*) as profile_count FROM profiles WHERE role = 'beneficiary';

-- beneficiaries 테이블 확인  
SELECT COUNT(*) as beneficiary_count FROM beneficiaries;

-- 최근 에러 로그 확인 (있다면)
SELECT * FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 10;