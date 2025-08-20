-- 트리거 함수가 제대로 작동하는지 확인
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- 트리거 상태 확인
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- auth 스키마 권한 확인
SELECT 
    nspname,
    nspacl
FROM pg_namespace
WHERE nspname IN ('auth', 'public');

-- 간단한 해결: 트리거 제거하고 수동 처리
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();