-- 더미 기업 계정 및 기부 데이터 생성
-- 실행 전 기존 테스트 데이터 삭제 (선택사항)

-- 1. 먼저 기업 사용자 계정 생성 (비밀번호: 123123)
DO $$
DECLARE
  user_id1 uuid;
  user_id2 uuid;
  user_id3 uuid;
  user_id4 uuid;
  user_id5 uuid;
  user_id6 uuid;
  user_id7 uuid;
  user_id8 uuid;
  user_id9 uuid;
  user_id10 uuid;
  
  business_id1 uuid;
  business_id2 uuid;
  business_id3 uuid;
  business_id4 uuid;
  business_id5 uuid;
  business_id6 uuid;
  business_id7 uuid;
  business_id8 uuid;
  business_id9 uuid;
  business_id10 uuid;
BEGIN
  -- Grand Hyatt 인천
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'grandhyatt@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id1;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id1, 'grandhyatt@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id1, 'Grand Hyatt 인천', '김현우', 'https://example.com/license1.pdf', 'grandhyatt@test.com', '032-123-4567', '인천광역시 중구 공항로 123', 'approved', NOW(), true)
  RETURNING id INTO business_id1;

  -- Andaz 강남
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'andaz@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id2;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id2, 'andaz@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id2, 'Andaz 강남', '이수진', 'https://example.com/license2.pdf', 'andaz@test.com', '02-2222-3333', '서울특별시 강남구 테헤란로 456', 'approved', NOW(), true)
  RETURNING id INTO business_id2;

  -- Four Seasons
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'fourseasons@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id3;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id3, 'fourseasons@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id3, 'Four Seasons', '박준호', 'https://example.com/license3.pdf', 'fourseasons@test.com', '02-3333-4444', '서울특별시 종로구 새문안로 789', 'approved', NOW(), true)
  RETURNING id INTO business_id3;

  -- Ben&Jerry's
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'benjerrys@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id4;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id4, 'benjerrys@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id4, 'Ben&Jerry''s', '정민아', 'https://example.com/license4.pdf', 'benjerrys@test.com', '02-4444-5555', '서울특별시 용산구 이태원로 321', 'approved', NOW(), true)
  RETURNING id INTO business_id4;

  -- 한국NVC출판사
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'nvcpub@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id5;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id5, 'nvcpub@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id5, '한국NVC출판사', '최영희', 'https://example.com/license5.pdf', 'nvcpub@test.com', '02-5555-6666', '서울특별시 마포구 서교동 123-45', 'approved', NOW(), true)
  RETURNING id INTO business_id5;

  -- 한글과자
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'hangeulsnack@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id6;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id6, 'hangeulsnack@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id6, '한글과자', '김철수', 'https://example.com/license6.pdf', 'hangeulsnack@test.com', '031-6666-7777', '경기도 파주시 문발로 567', 'approved', NOW(), true)
  RETURNING id INTO business_id6;

  -- Picky
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'picky@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id7;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id7, 'picky@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id7, 'Picky', '오지은', 'https://example.com/license7.pdf', 'picky@test.com', '02-7777-8888', '서울특별시 성동구 왕십리로 890', 'approved', NOW(), true)
  RETURNING id INTO business_id7;

  -- Ariabelle
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'ariabelle@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id8;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id8, 'ariabelle@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id8, 'Ariabelle', '홍서연', 'https://example.com/license8.pdf', 'ariabelle@test.com', '02-8888-9999', '서울특별시 송파구 올림픽로 123', 'approved', NOW(), true)
  RETURNING id INTO business_id8;

  -- 미네르바대학
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'minerva@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id9;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id9, 'minerva@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id9, '미네르바대학', '윤태영', 'https://example.com/license9.pdf', 'minerva@test.com', '02-9999-0000', '서울특별시 서초구 서초대로 456', 'approved', NOW(), true)
  RETURNING id INTO business_id9;

  -- 개인카페
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'privatecafe@test.com',
    crypt('123123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}'
  ) RETURNING id INTO user_id10;
  
  INSERT INTO profiles (id, email, role) VALUES (user_id10, 'privatecafe@test.com', 'business');
  
  INSERT INTO businesses (user_id, name, representative_name, business_license_url, email, phone, address, status, approved_at, contract_signed)
  VALUES (user_id10, '개인카페', '강민지', 'https://example.com/license10.pdf', 'privatecafe@test.com', '02-1111-2222', '서울특별시 은평구 연서로 789', 'approved', NOW(), true)
  RETURNING id INTO business_id10;

  -- 2. 기부 데이터 생성
  -- Grand Hyatt 인천 - 뷔페 음식
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status, notes)
  VALUES (business_id1, '뷔페 음식', 150, 'kg', NOW() + INTERVAL '7 days', '인천광역시 중구 공항로 123', true, 'pending_review', '주 3회 반복');

  -- Andaz 강남 - 뷔페 음식
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id2, '뷔페 음식', 80, 'kg', NOW() + INTERVAL '5 days', '서울특별시 강남구 테헤란로 456', true, 'pending_review');

  -- Four Seasons - 뷔페 음식
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id3, '뷔페 음식', 120, 'kg', NOW() + INTERVAL '6 days', '서울특별시 종로구 새문안로 789', true, 'pending_review');

  -- Ben&Jerry's - 아이스크림
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status, notes)
  VALUES (business_id4, '아이스크림', 200, '개', NOW() + INTERVAL '3 days', '서울특별시 용산구 이태원로 321', false, 'pending_review', '직접 배송');

  -- 한국NVC출판사 - 도서
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id5, '도서', 300, '권', NOW() + INTERVAL '10 days', '서울특별시 마포구 서교동 123-45', true, 'pending_review');

  -- 한글과자 - 스낵
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status, notes)
  VALUES (business_id6, '스낵', 2500, '개', NOW() + INTERVAL '7 days', '경기도 파주시 문발로 567', true, 'pending_review', '3개 기관 나눠서');

  -- Picky - 선크림
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id7, '선크림', 60, '개', NOW() + INTERVAL '5 days', '서울특별시 성동구 왕십리로 890', false, 'pending_review');

  -- Ariabelle - 기초화장품
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id8, '기초화장품', 100, '세트', NOW() + INTERVAL '8 days', '서울특별시 송파구 올림픽로 123', true, 'pending_review');

  -- 미네르바대학 - 책상
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status, notes)
  VALUES (business_id9, '책상', 200, '개', NOW() + INTERVAL '14 days', '서울특별시 서초구 서초대로 456', true, 'pending_review', '차량 필요, 운반자원봉사가능');

  -- 미네르바대학 - 의자
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id9, '의자', 360, '개', NOW() + INTERVAL '14 days', '서울특별시 서초구 서초대로 456', true, 'pending_review');

  -- 개인카페 - 유통기한 임박 원두
  INSERT INTO donations (business_id, description, quantity, unit, pickup_deadline, pickup_location, tax_deduction_needed, status)
  VALUES (business_id10, '유통기한 임박 원두', 80, 'kg', NOW() + INTERVAL '2 days', '서울특별시 은평구 연서로 789', false, 'pending_review');

END $$;

-- 생성된 계정 정보 출력
SELECT 
  b.name as "기업명",
  b.email as "이메일",
  '123123' as "비밀번호",
  b.status as "상태"
FROM businesses b
WHERE b.email LIKE '%@test.com'
ORDER BY b.created_at DESC
LIMIT 10;

-- 생성된 기부 데이터 확인
SELECT 
  b.name as "기업명",
  d.description as "품목",
  d.quantity || d.unit as "수량",
  d.notes as "조건",
  d.status as "상태"
FROM donations d
JOIN businesses b ON d.business_id = b.id
WHERE b.email LIKE '%@test.com'
ORDER BY d.created_at DESC;