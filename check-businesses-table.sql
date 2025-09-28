-- businesses 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
ORDER BY ordinal_position;

-- businesses 테이블의 모든 컬럼명만 간단히 보기
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
ORDER BY ordinal_position;