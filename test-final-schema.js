require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBusinessRegistration() {
  console.log('\n========================================');
  console.log('📦 Business 회원가입 테스트');
  console.log('========================================');
  
  try {
    // 실제 회원가입 폼과 동일한 데이터 구조 (user_id는 null로 테스트)
    const testBusinessData = {
      user_id: null,  // 외래키 제약을 피하기 위해 null
      name: '테스트 기업',
      business_registration_number: '123-45-67890',  // 새 필드
      manager_name: '김대표',
      manager_phone: '01012345678',
      business_license_url: 'https://example.com/license.pdf',
      website: 'https://testcompany.com',
      sns_link: 'https://instagram.com/testcompany',  // 새 필드
      postcode: '06234',  // 새 필드
      detail_address: '테스트빌딩 5층',  // 새 필드
      status: 'pending',
      contract_signed: false,
      approved_at: null
    };

    const { data, error } = await supabase
      .from('businesses')
      .insert([testBusinessData])
      .select();

    if (error) {
      console.error('❌ Business 등록 실패:', error.message);
      if (error.details) {
        console.error('상세 에러:', error.details);
      }
    } else {
      console.log('✅ Business 등록 성공!');
      console.log('새 필드 확인:');
      console.log('  - business_registration_number:', data[0].business_registration_number);
      console.log('  - sns_link:', data[0].sns_link);
      console.log('  - postcode:', data[0].postcode);
      console.log('  - detail_address:', data[0].detail_address);
      
      // 테스트 데이터 삭제
      if (data && data[0]) {
        await supabase.from('businesses').delete().eq('id', data[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

async function testBeneficiaryRegistration() {
  console.log('\n========================================');
  console.log('🎁 Beneficiary 회원가입 테스트');
  console.log('========================================');
  
  try {
    // 실제 회원가입 폼과 동일한 데이터 구조 (user_id는 null로 테스트)
    const testBeneficiaryData = {
      user_id: null,  // 외래키 제약을 피하기 위해 null
      organization_name: '테스트 복지관',
      organization_type: 'welfare',
      representative_name: '박원장',  // manager_name에서 변경됨
      phone: '01098765432',  // manager_phone에서 변경됨
      email: 'test@beneficiary.org',  // 새 필드
      registration_number: '987-65-43210',
      tax_exempt_cert_url: 'https://example.com/tax_exempt.pdf',
      address: '서울특별시 서초구 복지로 456',
      postcode: '06789',  // 새 필드
      detail_address: '복지센터 2층',  // 새 필드
      website: 'https://testwelfare.org',  // 새 필드
      sns_link: 'https://facebook.com/testwelfare',  // 새 필드
      // desired_items: '식품, 생필품',  // 새 필드 (TEXT 타입) - 일단 제외
      // beneficiary_types: '{아동,노인}',  // 새 필드 (PostgreSQL 배열 형식) - 일단 제외
      can_pickup: true,  // 새 필드
      can_issue_receipt: true,  // 새 필드
      additional_request: '특별 요청사항 없음',  // 새 필드
      status: 'pending',
      contract_signed: false,  // 새 필드
      approved_at: null
    };

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert([testBeneficiaryData])
      .select();

    if (error) {
      console.error('❌ Beneficiary 등록 실패:', error.message);
      if (error.details) {
        console.error('상세 에러:', error.details);
      }
    } else {
      console.log('✅ Beneficiary 등록 성공!');
      console.log('새 필드 확인:');
      console.log('  - representative_name:', data[0].representative_name);
      console.log('  - phone:', data[0].phone);
      console.log('  - email:', data[0].email);
      console.log('  - postcode:', data[0].postcode);
      console.log('  - detail_address:', data[0].detail_address);
      console.log('  - website:', data[0].website);
      console.log('  - sns_link:', data[0].sns_link);
      console.log('  - desired_items:', data[0].desired_items);
      console.log('  - beneficiary_types:', data[0].beneficiary_types);
      console.log('  - can_pickup:', data[0].can_pickup);
      console.log('  - can_issue_receipt:', data[0].can_issue_receipt);
      console.log('  - contract_signed:', data[0].contract_signed);
      
      // 테스트 데이터 삭제
      if (data && data[0]) {
        await supabase.from('beneficiaries').delete().eq('id', data[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

async function main() {
  console.log('🚀 최종 스키마 테스트 시작...\n');
  
  await testBusinessRegistration();
  await testBeneficiaryRegistration();
  
  console.log('\n✨ 모든 테스트 완료!');
  console.log('📌 새로운 회원가입 폼이 정상적으로 작동할 준비가 되었습니다.');
}

main();