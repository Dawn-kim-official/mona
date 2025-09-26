-- ========================================
-- 1. donation_matches 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'donation_matches'
ORDER BY ordinal_position;

-- ========================================
-- 2. donations 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'donations'
ORDER BY ordinal_position;

-- ========================================
-- 3. businesses 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- ========================================
-- 4. beneficiaries 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'beneficiaries'
ORDER BY ordinal_position;

-- ========================================
-- 5. quotes 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quotes'
ORDER BY ordinal_position;

-- ========================================
-- 6. reports 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- ========================================
-- 7. profiles 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- 8. notifications 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ========================================
-- 9. pickup_schedules 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_schedules'
ORDER BY ordinal_position;

-- ========================================
-- 10. subscriber_donations 테이블 구조 확인
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriber_donations'
ORDER BY ordinal_position;