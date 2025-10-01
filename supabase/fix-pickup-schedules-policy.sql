-- pickup_schedules 테이블의 기존 정책들 삭제
DROP POLICY IF EXISTS "Businesses can view their own pickup schedules" ON pickup_schedules;
DROP POLICY IF EXISTS "Admins can manage all pickup schedules" ON pickup_schedules;

-- 임시 정책: 모든 인증된 사용자가 pickup_schedules에 모든 작업 가능
CREATE POLICY "Temporary allow all authenticated users" ON pickup_schedules
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 현재 정책 확인
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'pickup_schedules';