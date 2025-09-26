require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBusinessTable() {
  console.log('\n========================================');
  console.log('Business 테이블 구조 확인');
  console.log('========================================');
  
  // 실제 데이터 1개만 가져와서 컬럼 확인
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Business 테이블 컬럼들:');
    console.log(Object.keys(data[0]));
  } else {
    // 빈 테이블인 경우 새 데이터 삽입 시도
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Company'
    };
    
    const { error: insertError } = await supabase
      .from('businesses')
      .insert([testData]);
      
    if (insertError) {
      console.log('필수 필드 확인 에러:', insertError.message);
    }
  }
}

async function checkBeneficiaryTable() {
  console.log('\n========================================');
  console.log('Beneficiary 테이블 구조 확인');
  console.log('========================================');
  
  // 실제 데이터 1개만 가져와서 컬럼 확인
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Beneficiary 테이블 컬럼들:');
    console.log(Object.keys(data[0]));
  } else {
    // 빈 테이블인 경우 새 데이터 삽입 시도
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000002',
      organization_name: 'Test Org'
    };
    
    const { error: insertError } = await supabase
      .from('beneficiaries')
      .insert([testData]);
      
    if (insertError) {
      console.log('필수 필드 확인 에러:', insertError.message);
    }
  }
}

async function main() {
  await checkBusinessTable();
  await checkBeneficiaryTable();
}

main();