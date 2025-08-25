-- 음식 기부 더미 데이터 생성 스크립트
-- 주의: 개발 환경에서만 사용하세요!

-- pickup_schedules 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS pickup_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_staff VARCHAR(255),
  vehicle_info VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 테스트 데이터 삭제 (선택사항)
-- DELETE FROM donations WHERE description LIKE '%테스트%';
-- DELETE FROM businesses WHERE email LIKE '%test%';

-- 음식 관련 비즈니스 생성
DO $$
DECLARE
  v_business_id1 UUID;
  v_business_id2 UUID;
  v_business_id3 UUID;
  v_donation_id UUID;
BEGIN
  -- 승인된 레스토랑/카페 비즈니스
  INSERT INTO businesses (name, representative_name, email, phone, address, status, approved_at, contract_signed, business_license_url)
  VALUES (
    '그린 키친',
    '김요리',
    'contact@greenkitchen.com',
    '02-1234-5678',
    '123-45-67890',
    'approved',
    NOW() - INTERVAL '30 days',
    true,
    'https://example.com/licenses/greenkitchen-license.pdf'
  ) RETURNING id INTO v_business_id1;

  INSERT INTO businesses (name, representative_name, email, phone, address, status, approved_at, contract_signed, business_license_url)
  VALUES (
    '행복한 베이커리',
    '박제빵',
    'info@happybakery.kr',
    '02-2345-6789',
    '234-56-78901',
    'approved',
    NOW() - INTERVAL '20 days',
    true,
    'https://example.com/licenses/happybakery-license.pdf'
  ) RETURNING id INTO v_business_id2;

  -- 승인 대기 중인 비즈니스
  INSERT INTO businesses (name, representative_name, email, phone, address, status, contract_signed, business_license_url)
  VALUES (
    '신선 마트',
    '이신선',
    'fresh@mart.co.kr',
    '02-3456-7890',
    '345-67-89012',
    'pending',
    false,
    'https://example.com/licenses/freshmart-license.pdf'
  ) RETURNING id INTO v_business_id3;

  -- 다양한 상태의 음식 기부 데이터 생성

  -- 1. 승인 대기 상태
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id1, '도시락', '유통기한 임박 도시락', 30, 'kg', NOW() + INTERVAL '1 days', '서울시 강남구 테헤란로 123', 'pending_review', NOW() - INTERVAL '2 hours'),
    (v_business_id2, '샌드위치', '당일 제조 샌드위치', 15, 'kg', NOW() + INTERVAL '6 hours', '서울시 서초구 서초대로 456', 'pending_review', NOW() - INTERVAL '1 hour'),
    (v_business_id1, '김밥', '야채김밥, 참치김밥 등', 20, 'kg', NOW() + INTERVAL '8 hours', '서울시 강남구 테헤란로 123', 'pending_review', NOW() - INTERVAL '30 minutes');

  -- 2. 견적 대기 상태
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id2, '빵류', '크로와상, 베이글 등 당일 생산 빵', 25, 'kg', NOW() + INTERVAL '12 hours', '서울시 서초구 서초대로 456', 'matched', NOW() - INTERVAL '1 day'),
    (v_business_id1, '샐러드', '신선 야채 샐러드', 10, 'kg', NOW() + INTERVAL '4 hours', '서울시 강남구 테헤란로 123', 'matched', NOW() - INTERVAL '3 days');

  -- 3. 견적서 발송된 상태 (견적서 포함)
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id1, '반찬류', '각종 밑반찬 세트', 40, 'kg', NOW() + INTERVAL '2 days', '서울시 강남구 테헤란로 123', 'quote_sent', NOW() - INTERVAL '5 days')
  RETURNING id INTO v_donation_id;

  -- 견적서 추가
  INSERT INTO quotes (donation_id, unit_price, logistics_cost, total_amount, estimated_pickup_date, pickup_time, status, created_at)
  VALUES 
    (v_donation_id, 200000, 20000, 220000, NOW() + INTERVAL '2 days', '14:00', 'pending', NOW() - INTERVAL '3 days');

  -- 4. 픽업 예정 상태
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id2, '케이크', '생크림 케이크 (유통기한 D-1)', 8, 'kg', NOW() + INTERVAL '3 hours', '서울시 서초구 서초대로 456', 'pickup_scheduled', NOW() - INTERVAL '7 days')
  RETURNING id INTO v_donation_id;

  -- 견적서와 픽업 일정 추가
  INSERT INTO quotes (donation_id, unit_price, logistics_cost, total_amount, estimated_pickup_date, pickup_time, status, created_at)
  VALUES 
    (v_donation_id, 150000, 15000, 165000, NOW() + INTERVAL '3 hours', '18:00', 'accepted', NOW() - INTERVAL '5 days');

  INSERT INTO pickup_schedules (donation_id, pickup_date, pickup_time, pickup_staff, vehicle_info, status, created_at)
  VALUES 
    (v_donation_id, NOW()::DATE, '18:00', '김기사', '냉장탑차 (서울12가3456)', 'scheduled', NOW() - INTERVAL '2 days');

  -- 5. 완료된 기부들
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at, completed_at)
  VALUES 
    (v_business_id1, '도시락', '유동기한 임박 도시락', 50, 'kg', NOW() - INTERVAL '7 days', '서울시 강남구 테헤란로 123', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'),
    (v_business_id2, '빵류', '당일 생산 빵 (식빵, 모닝빵 등)', 30, 'kg', NOW() - INTERVAL '14 days', '서울시 서초구 서초대로 456', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
    (v_business_id1, '반찬', '김치, 장조림 등 밑반찬', 35, 'kg', NOW() - INTERVAL '20 days', '서울시 강남구 테헤란로 123', 'completed', NOW() - INTERVAL '22 days', NOW() - INTERVAL '20 days');

  -- ESG 리포트 URL 업데이트
  UPDATE businesses 
  SET esg_report_url = 'https://example.com/esg-reports/greenkitchen-2024-q3.pdf'
  WHERE id = v_business_id1;

  UPDATE businesses 
  SET esg_report_url = 'https://example.com/esg-reports/happybakery-2024-q3.pdf'
  WHERE id = v_business_id2;

  RAISE NOTICE '음식 기부 더미 데이터 10개가 생성되었습니다!';
END $$;