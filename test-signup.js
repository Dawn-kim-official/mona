const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://ipieplfljolfssmvxpub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWVwbGZsam9sZnNzbXZ4cHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjAwMzksImV4cCI6MjA3MDYzNjAzOX0.XyTg4LtzFaXc__e_68Sc6dYLypTbiDXkwTHdossiotE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 테스트용 기업 데이터
async function testBusinessSignup() {
  console.log('Starting business signup test...');
  
  try {
    // 1. 사용자 생성
    const timestamp = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `testbusiness_${timestamp}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError) {
      console.error('Business auth error:', authError);
      return;
    }

    console.log('Business user created:', authData.user.id);
    const businessEmail = `testbusiness_${timestamp}@example.com`;

    // 2. profiles 테이블에 추가
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: businessEmail,
        role: 'business'
      });

    if (profileError) {
      console.error('Business profile error:', profileError);
      return;
    }

    // 3. businesses 테이블에 추가
    const { error: businessError } = await supabase
      .from('businesses')
      .insert({
        user_id: authData.user.id,
        name: '테스트 기업',
        business_number: '123-45-67890',
        manager_name: '김대표',
        manager_phone: '01012345678',
        business_license_url: 'https://example.com/license.pdf',
        website: 'https://testcompany.com',
        status: 'pending',
        contract_signed: false
      });

    if (businessError) {
      console.error('Business insert error:', businessError);
      return;
    }

    console.log('✅ Business signup test completed successfully!');
    
  } catch (error) {
    console.error('Business signup test error:', error);
  }
}

// 테스트용 수혜기관 데이터
async function testBeneficiarySignup() {
  console.log('Starting beneficiary signup test...');
  
  try {
    // 1. 사용자 생성
    const timestamp = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `testbeneficiary_${timestamp}@example.com`,
      password: 'TestPassword123!',
    });

    if (authError) {
      console.error('Beneficiary auth error:', authError);
      return;
    }

    console.log('Beneficiary user created:', authData.user.id);
    const beneficiaryEmail = `testbeneficiary_${timestamp}@example.com`;

    // 2. profiles 테이블에 추가
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: beneficiaryEmail,
        role: 'beneficiary'
      });

    if (profileError) {
      console.error('Beneficiary profile error:', profileError);
      return;
    }

    // 3. beneficiaries 테이블에 추가 (3단계 체크박스 데이터 포함)
    const { error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .insert({
        user_id: authData.user.id,
        organization_name: '희망 복지재단',
        organization_type: '사회복지법인',
        manager_name: '박담당',
        manager_phone: '01087654321',
        address: '서울특별시 강남구 테헤란로 123',
        postcode: '06234',
        website: 'https://hope-foundation.org',
        sns_link: 'https://instagram.com/hope_foundation',
        tax_exempt_cert_url: 'https://example.com/tax-exempt.pdf',
        registration_number: '110-82-12345',
        // 3단계 체크박스 데이터
        desired_items: ['식품', '생활용품', '의류'],
        beneficiary_types: ['아동', '노인', '장애인'],
        can_pickup: true,
        can_issue_receipt: true,
        additional_request: '대량 기부 시 차량 지원 가능합니다',
        status: 'pending',
        contract_signed: false
      });

    if (beneficiaryError) {
      console.error('Beneficiary insert error:', beneficiaryError);
      return;
    }

    console.log('✅ Beneficiary signup test completed successfully!');
    
  } catch (error) {
    console.error('Beneficiary signup test error:', error);
  }
}

// 실행
async function runTests() {
  console.log('=== Starting Signup Tests ===\n');
  
  await testBusinessSignup();
  console.log('\n---\n');
  await testBeneficiarySignup();
  
  console.log('\n=== Tests Completed ===');
}

runTests();