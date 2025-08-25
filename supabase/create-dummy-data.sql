-- 음식 기부 더미 데이터 생성 스크립트
-- 주의: 개발 환경에서만 사용하세요!

-- 1. 테스트용 비즈니스 사용자 생성 (이미 있다면 스킵)
DO $$
DECLARE
  v_user_id1 UUID;
  v_user_id2 UUID;
  v_user_id3 UUID;
  v_business_id1 UUID;
  v_business_id2 UUID;
  v_business_id3 UUID;
BEGIN
  -- 테스트 사용자가 이미 있는지 확인
  SELECT id INTO v_user_id1 FROM auth.users WHERE email = 'test1@company.com';
  SELECT id INTO v_user_id2 FROM auth.users WHERE email = 'test2@company.com';
  SELECT id INTO v_user_id3 FROM auth.users WHERE email = 'test3@company.com';
  
  -- 없으면 생성 (실제로는 auth.users에 직접 삽입할 수 없으므로 이미 생성된 사용자 ID를 사용)
  -- 여기서는 businesses 테이블에만 더미 데이터 추가
  
  -- 승인된 비즈니스 1
  INSERT INTO businesses (name, representative_name, email, phone, address, status, approved_at, contract_signed)
  VALUES (
    '주식회사 그린테크',
    '김환경',
    'contact@greentech.com',
    '02-1234-5678',
    '123-45-67890',
    'approved',
    NOW() - INTERVAL '30 days',
    true
  ) RETURNING id INTO v_business_id1;

  -- 승인된 비즈니스 2
  INSERT INTO businesses (name, representative_name, email, phone, address, status, approved_at, contract_signed)
  VALUES (
    '에코플러스',
    '박재활용',
    'info@ecoplus.kr',
    '02-2345-6789',
    '234-56-78901',
    'approved',
    NOW() - INTERVAL '45 days',
    true
  ) RETURNING id INTO v_business_id2;

  -- 승인 대기 비즈니스
  INSERT INTO businesses (name, representative_name, email, phone, address, status, contract_signed)
  VALUES (
    '클린에너지',
    '이청정',
    'hello@cleanenergy.co.kr',
    '02-3456-7890',
    '345-67-89012',
    'pending',
    false
  ) RETURNING id INTO v_business_id3;

  -- 2. 다양한 상태의 기부 데이터 생성
  
  -- 승인 대기 기부들
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id1, '사무용 의자', '상태 양호한 사무용 의자 20개', 20, '개', NOW() + INTERVAL '7 days', '서울시 강남구 테헤란로 123', 'pending_review', NOW() - INTERVAL '1 day'),
    (v_business_id2, '노트북', '업무용 노트북 (i5, 8GB RAM)', 15, '대', NOW() + INTERVAL '10 days', '서울시 서초구 강남대로 456', 'pending_review', NOW() - INTERVAL '2 days'),
    (v_business_id1, '프린터', 'HP 레이저젯 프린터', 5, '대', NOW() + INTERVAL '5 days', '서울시 강남구 테헤란로 123', 'pending_review', NOW() - INTERVAL '3 hours');

  -- 승인 거절된 기부
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id2, '오래된 모니터', 'CRT 모니터 (고장)', 10, '대', NOW() + INTERVAL '3 days', '서울시 서초구 강남대로 456', 'rejected', NOW() - INTERVAL '5 days');

  -- 견적 대기 중인 기부들
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
  VALUES 
    (v_business_id1, '사무용 책상', '1200x600 사무용 책상', 30, '개', NOW() + INTERVAL '14 days', '서울시 강남구 테헤란로 123', 'matched', NOW() - INTERVAL '7 days'),
    (v_business_id2, '의류', '유니폼 및 작업복', 200, 'kg', NOW() + INTERVAL '20 days', '서울시 서초구 강남대로 456', 'matched', NOW() - INTERVAL '10 days');

  -- 견적서 발송된 기부들
  DECLARE
    v_donation_id1 UUID;
    v_donation_id2 UUID;
    v_donation_id3 UUID;
  BEGIN
    INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
    VALUES 
      (v_business_id1, '컴퓨터 본체', 'Dell OptiPlex (i7, 16GB)', 25, '대', NOW() + INTERVAL '15 days', '서울시 강남구 테헤란로 123', 'quote_sent', NOW() - INTERVAL '12 days')
    RETURNING id INTO v_donation_id1;

    INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
    VALUES 
      (v_business_id2, '사무용품 세트', '펜, 노트, 파일 등', 50, 'box', NOW() + INTERVAL '10 days', '서울시 서초구 강남대로 456', 'quote_sent', NOW() - INTERVAL '8 days')
    RETURNING id INTO v_donation_id2;

    -- 견적서 데이터도 추가
    INSERT INTO quotes (donation_id, unit_price, logistics_cost, total_amount, estimated_pickup_date, pickup_time, status, created_at)
    VALUES 
      (v_donation_id1, 1000000, 100000, 1100000, NOW() + INTERVAL '15 days', '14:00', 'pending', NOW() - INTERVAL '5 days'),
      (v_donation_id2, 500000, 50000, 550000, NOW() + INTERVAL '10 days', '10:00', 'pending', NOW() - INTERVAL '3 days');
  END;

  -- 견적 수락된 기부
  DECLARE
    v_donation_id4 UUID;
  BEGIN
    INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at)
    VALUES 
      (v_business_id1, '냉장고', '업무용 냉장고 (600L)', 3, '대', NOW() + INTERVAL '7 days', '서울시 강남구 테헤란로 123', 'pickup_scheduled', NOW() - INTERVAL '15 days')
    RETURNING id INTO v_donation_id4;

    -- 견적서와 픽업 일정 추가
    INSERT INTO quotes (donation_id, unit_price, logistics_cost, total_amount, estimated_pickup_date, pickup_time, status, created_at)
    VALUES 
      (v_donation_id4, 300000, 30000, 330000, NOW() + INTERVAL '7 days', '15:00', 'accepted', NOW() - INTERVAL '10 days');

    INSERT INTO pickup_schedules (donation_id, pickup_date, pickup_time, pickup_staff, vehicle_info, status, created_at)
    VALUES 
      (v_donation_id4, NOW() + INTERVAL '7 days', '15:00', '김기사', '1톤 트럭 (12가 3456)', 'scheduled', NOW() - INTERVAL '2 days');
  END;

  -- 완료된 기부들
  INSERT INTO donations (business_id, name, description, quantity, unit, pickup_deadline, pickup_location, status, created_at, completed_at)
  VALUES 
    (v_business_id1, '사무용 파티션', '1500x1800 파티션', 20, '개', NOW() - INTERVAL '5 days', '서울시 강남구 테헤란로 123', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
    (v_business_id2, 'A4 용지', 'A4 복사용지 (박스)', 100, 'box', NOW() - INTERVAL '10 days', '서울시 서초구 강남대로 456', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'),
    (v_business_id1, '회의용 테이블', '원형 회의 테이블', 5, '개', NOW() - INTERVAL '15 days', '서울시 강남구 테헤란로 123', 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days');

  -- 3. ESG 리포트 URL 업데이트 (더미 URL)
  UPDATE businesses 
  SET esg_report_url = 'https://example.com/esg-reports/greentech-2024-q3.pdf'
  WHERE id = v_business_id1;

  UPDATE businesses 
  SET esg_report_url = 'https://example.com/esg-reports/ecoplus-2024-q3.pdf'
  WHERE id = v_business_id2;

END $$;

-- 4. 어드민 대시보드용 통계를 위한 추가 데이터
-- 다양한 날짜의 기부 데이터 추가
DO $$
DECLARE
  v_business_id UUID;
  v_date DATE;
BEGIN
  -- 첫 번째 승인된 비즈니스 ID 가져오기
  SELECT id INTO v_business_id FROM businesses WHERE status = 'approved' LIMIT 1;
  
  -- 최근 30일간의 기부 데이터 생성
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - (i || ' days')::INTERVAL;
    
    -- 각 날짜마다 1-3개의 기부 랜덤 생성
    FOR j IN 1..(1 + (RANDOM() * 2)::INT) LOOP
      INSERT INTO donations (
        business_id, 
        name, 
        description, 
        quantity, 
        unit, 
        pickup_deadline, 
        pickup_location, 
        status, 
        created_at,
        completed_at
      )
      VALUES (
        v_business_id,
        CASE (RANDOM() * 5)::INT
          WHEN 0 THEN '사무용품'
          WHEN 1 THEN '전자제품'
          WHEN 2 THEN '가구류'
          WHEN 3 THEN '의류'
          ELSE '기타 물품'
        END,
        '상태 양호한 중고 물품',
        (10 + (RANDOM() * 90)::INT),
        CASE (RANDOM() * 3)::INT
          WHEN 0 THEN '개'
          WHEN 1 THEN 'kg'
          ELSE 'box'
        END,
        v_date + INTERVAL '7 days',
        '서울시 강남구 테헤란로 ' || (100 + (RANDOM() * 400)::INT),
        CASE 
          WHEN i < 5 THEN 'completed'
          WHEN i < 10 THEN 'pickup_scheduled'
          WHEN i < 15 THEN 'quote_sent'
          WHEN i < 20 THEN 'matched'
          ELSE 'pending_review'
        END,
        v_date,
        CASE 
          WHEN i < 5 THEN v_date + INTERVAL '5 days'
          ELSE NULL
        END
      );
    END LOOP;
  END LOOP;
END $$;

RAISE NOTICE '더미 데이터 생성이 완료되었습니다!';