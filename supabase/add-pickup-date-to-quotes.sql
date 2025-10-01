-- quotes 테이블에 estimated_pickup_date 컬럼 추가 (이미 있을 수 있으므로 조건부로 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'estimated_pickup_date') THEN
        ALTER TABLE quotes ADD COLUMN estimated_pickup_date DATE;
    END IF;
END $$;

-- pickup_time 컬럼도 추가 (이미 있을 수 있으므로 조건부로 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'pickup_time') THEN
        ALTER TABLE quotes ADD COLUMN pickup_time TEXT;
    END IF;
END $$;

-- special_notes 컬럼도 추가 (이미 있을 수 있으므로 조건부로 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'special_notes') THEN
        ALTER TABLE quotes ADD COLUMN special_notes TEXT;
    END IF;
END $$;

-- unit_price, logistics_cost, total_amount 컬럼들도 확인하고 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'unit_price') THEN
        ALTER TABLE quotes ADD COLUMN unit_price INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'logistics_cost') THEN
        ALTER TABLE quotes ADD COLUMN logistics_cost INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'total_amount') THEN
        ALTER TABLE quotes ADD COLUMN total_amount INTEGER;
    END IF;
END $$;

-- status 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotes' 
                   AND column_name = 'status') THEN
        ALTER TABLE quotes ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- draft 상태 추가 (기존에 없을 수 있으므로)
DO $$ 
BEGIN
    -- 먼저 현재 제약조건 제거
    ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
    
    -- 새로운 제약조건 추가
    ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
        CHECK (status IN ('draft', 'pending', 'accepted', 'rejected'));
END $$;