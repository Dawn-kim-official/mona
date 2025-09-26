require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBusinessAddress() {
  console.log('\n========================================');
  console.log('📍 Business 주소 필드 확인 테스트');
  console.log('========================================');
  
  try {
    // 첫 번째 business 레코드 가져오기
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, address, postcode, detail_address, manager_name')
      .limit(3);

    if (error) {
      console.error('❌ 에러 발생:', error.message);
      return;
    }

    if (!businesses || businesses.length === 0) {
      console.log('⚠️  등록된 기업이 없습니다.');
      return;
    }

    console.log(`✅ ${businesses.length}개 기업 데이터 확인:\n`);
    
    businesses.forEach((business, index) => {
      console.log(`[기업 ${index + 1}] ${business.name || '이름없음'}`);
      console.log(`  - ID: ${business.id}`);
      console.log(`  - 담당자: ${business.manager_name || '없음'}`);
      console.log(`  - 주소: ${business.address || '없음'}`);
      console.log(`  - 우편번호: ${business.postcode || '없음'}`);
      console.log(`  - 상세주소: ${business.detail_address || '없음'}`);
      console.log('');
    });

    // 주소 필드가 있는 기업 수 확인
    const hasAddress = businesses.filter(b => b.address).length;
    const hasPostcode = businesses.filter(b => b.postcode).length;
    const hasDetail = businesses.filter(b => b.detail_address).length;
    
    console.log('📊 필드별 데이터 현황:');
    console.log(`  - address 필드가 있는 기업: ${hasAddress}/${businesses.length}`);
    console.log(`  - postcode 필드가 있는 기업: ${hasPostcode}/${businesses.length}`);
    console.log(`  - detail_address 필드가 있는 기업: ${hasDetail}/${businesses.length}`);
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

async function main() {
  console.log('🚀 Business 주소 필드 테스트 시작...\n');
  await testBusinessAddress();
  console.log('\n✨ 테스트 완료!');
}

main();