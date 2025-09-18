-- donations 테이블에 unit과 관련 필드 추가
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(100),
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good';

-- 기존 데이터에 대한 기본값 설정
UPDATE donations 
SET unit = 'kg' 
WHERE unit IS NULL;

-- name 필드가 비어있는 경우 description에서 가져오기
UPDATE donations 
SET name = SPLIT_PART(description, ' - ', 1)
WHERE name IS NULL OR name = '';