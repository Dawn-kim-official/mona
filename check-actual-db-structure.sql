-- ========================================
-- Supabase 실제 데이터베이스 구조 확인 쿼리
-- ========================================

-- 1. businesses 테이블의 모든 컬럼 확인
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

-- 2. businesses 테이블 샘플 데이터 (상위 3개)
SELECT * FROM businesses LIMIT 3;

-- 3. 필요한 컬럼들의 존재 여부 확인
SELECT 
    'business_registration_number' as column_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'business_registration_number'
    ) as exists
UNION ALL
SELECT 
    'manager_name',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'manager_name'
    )
UNION ALL
SELECT 
    'manager_phone',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'manager_phone'
    )
UNION ALL
SELECT 
    'postcode',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'postcode'
    )
UNION ALL
SELECT 
    'detail_address',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'detail_address'
    )
UNION ALL
SELECT 
    'sns_link',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'sns_link'
    );

-- 4. 모든 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. donations 테이블 구조 확인 (빌드 오류 관련)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'donations'
ORDER BY ordinal_position;