-- quotes 테이블 구조 상세 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'quotes'
ORDER BY ordinal_position;

-- quotes 테이블의 실제 데이터 확인
SELECT * FROM quotes;

-- donations 테이블의 status 값들 확인
SELECT DISTINCT status FROM donations;

-- donation_matches 테이블의 status 값들 확인  
SELECT DISTINCT status FROM donation_matches;

-- 현재 문제가 되는 기부와 견적서 데이터 확인 (가장 최근 것들)
SELECT 
    d.id as donation_id,
    d.status as donation_status,
    dm.id as match_id,
    dm.status as match_status,
    q.id as quote_id,
    q.status as quote_status
FROM donations d
LEFT JOIN donation_matches dm ON d.id = dm.donation_id
LEFT JOIN quotes q ON d.id = q.donation_id
WHERE d.status IN ('quote_sent', 'quote_accepted')
ORDER BY d.created_at DESC;