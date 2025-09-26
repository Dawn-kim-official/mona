-- beneficiaries 테이블에 누락된 필드 추가
-- manager_name/manager_phone 필드가 있는데 representative_name/phone으로 변경 필요

-- 1. 기존 manager_name, manager_phone 컬럼 이름 변경 (이미 데이터가 있을 수 있음)
ALTER TABLE beneficiaries 
RENAME COLUMN manager_name TO representative_name;

ALTER TABLE beneficiaries 
RENAME COLUMN manager_phone TO phone;

-- 2. email 컬럼 추가 (이미 있을 수 있으므로 IF NOT EXISTS 사용)
-- 하지만 PostgreSQL의 ALTER TABLE ADD COLUMN은 IF NOT EXISTS를 지원하지 않음
-- 따라서 DO 블록을 사용

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='email') THEN
        ALTER TABLE beneficiaries ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- 3. detail_address 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='detail_address') THEN
        ALTER TABLE beneficiaries ADD COLUMN detail_address TEXT;
    END IF;
END $$;

-- 4. desired_items 컬럼 추가 (Step 3에서 사용)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='desired_items') THEN
        ALTER TABLE beneficiaries ADD COLUMN desired_items TEXT;
    END IF;
END $$;

-- 5. beneficiary_types 컬럼 추가 (배열 타입)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='beneficiary_types') THEN
        ALTER TABLE beneficiaries ADD COLUMN beneficiary_types TEXT[];
    END IF;
END $$;

-- 6. can_pickup 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='can_pickup') THEN
        ALTER TABLE beneficiaries ADD COLUMN can_pickup BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 7. can_issue_receipt 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='can_issue_receipt') THEN
        ALTER TABLE beneficiaries ADD COLUMN can_issue_receipt BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 8. additional_request 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='additional_request') THEN
        ALTER TABLE beneficiaries ADD COLUMN additional_request TEXT;
    END IF;
END $$;

-- 9. contract_signed 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='beneficiaries' AND column_name='contract_signed') THEN
        ALTER TABLE beneficiaries ADD COLUMN contract_signed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 10. 컬럼 코멘트 추가
COMMENT ON COLUMN beneficiaries.representative_name IS '담당자명';
COMMENT ON COLUMN beneficiaries.phone IS '담당자 전화번호';
COMMENT ON COLUMN beneficiaries.email IS '이메일';
COMMENT ON COLUMN beneficiaries.detail_address IS '상세주소';
COMMENT ON COLUMN beneficiaries.desired_items IS '희망 기부물품';
COMMENT ON COLUMN beneficiaries.beneficiary_types IS '수혜 대상 유형';
COMMENT ON COLUMN beneficiaries.can_pickup IS '직접 픽업 가능 여부';
COMMENT ON COLUMN beneficiaries.can_issue_receipt IS '기부금영수증 발급 가능 여부';
COMMENT ON COLUMN beneficiaries.additional_request IS '추가 요청사항';
COMMENT ON COLUMN beneficiaries.contract_signed IS '계약서 서명 여부';