-- 사용자별 역할 확인 쿼리
SELECT 
  u.id,
  u.email,
  p.role::text,
  CASE 
    WHEN p.role::text = 'admin' THEN '관리자'
    WHEN p.role::text = 'business' THEN '기부기업'
    WHEN ben.id IS NOT NULL THEN '수혜기관'
    ELSE p.role::text
  END as role_korean,
  CASE
    WHEN b.id IS NOT NULL THEN b.name
    WHEN ben.id IS NOT NULL THEN ben.organization_name
    ELSE NULL
  END as organization_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN businesses b ON u.id = b.user_id
LEFT JOIN beneficiaries ben ON u.id = ben.user_id
ORDER BY u.created_at DESC;