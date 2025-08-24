-- 테스트 데이터 생성 스크립트

-- 1. 테스트 기부 데이터 생성 (quote_sent 상태)
INSERT INTO donations (
    business_id,
    name,
    description,
    quantity,
    unit,
    condition,
    pickup_location,
    pickup_deadline,
    status,
    created_at
) VALUES (
    (SELECT id FROM businesses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')),
    '유통기한 임박 빵류',
    '유통기한 임박 빵류',
    20,
    'kg',
    'good',
    '서울시 강남구 테헤란로 123 ○○빌딩 5층',
    '2025-08-15',
    'quote_sent',
    NOW()
);

-- 2. 해당 기부에 대한 견적서 생성
INSERT INTO quotes (
    donation_id,
    subscriber_id,
    quote_amount,
    pickup_fee,
    tax_amount,
    total_amount,
    pickup_date,
    status,
    notes,
    created_at
) VALUES (
    (SELECT id FROM donations WHERE description = '유통기한 임박 빵류' ORDER BY created_at DESC LIMIT 1),
    NULL, -- 구독자 ID는 나중에 설정
    150000,
    0,
    225000,
    2475000,
    '2025-08-12T14:00:00',
    'pending',
    '픽업일까지 냉동 보관 부탁드립니다',
    NOW()
);

-- 3. 추가 테스트 데이터들
INSERT INTO donations (business_id, name, description, quantity, unit, condition, pickup_location, pickup_deadline, status, created_at)
VALUES 
    ((SELECT id FROM businesses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')), 
     '의류', '의류', 50, 'kg', 'good', '서울시 강남구', '2025-08-20', 'pending_review', NOW()),
    ((SELECT id FROM businesses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')), 
     '전자제품', '전자제품', 10, '개', 'fair', '서울시 서초구', '2025-08-25', 'pickup_scheduled', NOW()),
    ((SELECT id FROM businesses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')), 
     '가구', '가구', 5, '개', 'good', '서울시 송파구', '2025-08-30', 'completed', NOW());

-- 4. 상태별로 더 많은 데이터 추가
UPDATE donations 
SET status = 'rejected' 
WHERE description = '의류';

UPDATE donations 
SET status = 'completed', completed_at = NOW() 
WHERE description = '가구';