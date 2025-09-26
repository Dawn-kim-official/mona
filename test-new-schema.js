require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL 또는 Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBusinessSchema() {
  console.log('\n========================================');
  console.log('1. Business 테이블 새 필드 테스트');
  console.log('========================================');
  
  try {
    // 테스트용 비즈니스 데이터 (실제 컬럼명에 맞춤)
    const testBusinessData = {
      user_id: '00000000-0000-0000-0000-000000000001', // 테스트 UUID
      name: '테스트 기업',
      manager_name: '김대표',  // representative_name 대신
      manager_phone: '01012345678',  // phone 대신
      business_license_url: 'https://example.com/license.pdf',
      business_number: '123-45-67890',  // 기존 필드
      website: 'https://testcompany.com',
      // 새로 추가된 필드들
      business_registration_number: '123-45-67890',
      sns_link: 'https://instagram.com/testcompany',
      postcode: '06234',
      detail_address: '테스트빌딩 5층',
      status: 'pending',
      contract_signed: false
    };

    const { data, error } = await supabase
      .from('businesses')
      .insert([testBusinessData])
      .select();

    if (error) {
      console.error('Business 등록 실패:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Business 등록 성공!');
      console.log('등록된 데이터:', JSON.stringify(data, null, 2));
      
      // 등록된 데이터 삭제 (테스트 완료 후 정리)
      if (data && data[0]) {
        await supabase
          .from('businesses')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function testBeneficiarySchema() {
  console.log('\n========================================');
  console.log('2. Beneficiary 테이블 새 필드 테스트');
  console.log('========================================');
  
  try {
    // 테스트용 수혜기관 데이터
    const testBeneficiaryData = {
      user_id: '00000000-0000-0000-0000-000000000002', // 테스트 UUID
      organization_name: '테스트 복지관',
      organization_type: 'welfare',
      representative_name: '박원장',
      email: 'test@beneficiary.org',
      phone: '01098765432',
      address: '서울특별시 서초구 복지로 456',
      registration_number: '987-65-43210',
      // 새로 추가된 필드들
      website: 'https://testwelfare.org',
      sns_link: 'https://facebook.com/testwelfare',
      postcode: '06789',
      detail_address: '복지센터 2층',
      tax_exempt_cert_url: 'https://example.com/tax_exempt.pdf',
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert([testBeneficiaryData])
      .select();

    if (error) {
      console.error('Beneficiary 등록 실패:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Beneficiary 등록 성공!');
      console.log('등록된 데이터:', JSON.stringify(data, null, 2));
      
      // 등록된 데이터 삭제 (테스트 완료 후 정리)
      if (data && data[0]) {
        await supabase
          .from('beneficiaries')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function checkTableStructure() {
  console.log('\n========================================');
  console.log('3. 테이블 구조 확인');
  console.log('========================================');
  
  // 빈 데이터로 select하여 컬럼 구조 확인
  const { data: businessColumns } = await supabase
    .from('businesses')
    .select()
    .limit(0);
    
  const { data: beneficiaryColumns } = await supabase
    .from('beneficiaries')
    .select()
    .limit(0);
    
  console.log('✅ 테이블 구조 확인 완료');
  console.log('(컬럼 목록은 Supabase 대시보드에서 확인 가능)');
}

// 모든 테스트 실행
async function runAllTests() {
  console.log('📋 새로운 스키마 테스트 시작...\n');
  
  await testBusinessSchema();
  await testBeneficiarySchema();
  await checkTableStructure();
  
  console.log('\n✨ 모든 테스트 완료!');
}

runAllTests();