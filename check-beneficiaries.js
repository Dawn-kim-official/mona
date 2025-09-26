require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBeneficiariesStructure() {
  // Admin 유저로 로그인하여 권한 얻기
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@monaofficial.co',
    password: 'admin123456'
  });
  
  if (signInError) {
    console.error('로그인 실패:', signInError);
    return;
  }
  
  console.log('Admin으로 로그인 성공');
  
  // beneficiaries 테이블 데이터 확인
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('\nBeneficiaries 테이블 컬럼들:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('Beneficiaries 테이블이 비어있습니다.');
  }
  
  // 로그아웃
  await supabase.auth.signOut();
}

checkBeneficiariesStructure();