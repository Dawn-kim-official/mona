-- quotes 테이블의 제약조건 확인
SELECT
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause,
    kcu.column_name
FROM 
    information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'quotes'
ORDER BY tc.constraint_type;

-- quotes 테이블의 status 컬럼 상세 정보
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'status';

-- 직접 quotes 테이블 업데이트 테스트
-- 가장 최근 pending 상태의 quote를 찾아서 업데이트 시도
SELECT id, status FROM quotes WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;

-- 테스트 업데이트 (실제 ID는 위 결과에서 확인 후 사용)
-- UPDATE quotes SET status = 'accepted' WHERE id = '실제_quote_id';

-- 업데이트 후 확인
-- SELECT id, status, updated_at FROM quotes WHERE id = '실제_quote_id';