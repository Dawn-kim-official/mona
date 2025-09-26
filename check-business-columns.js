require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  console.log('\n========================================');
  console.log('📋 Businesses 테이블 컬럼 확인');
  console.log('========================================');
  
  try {
    // 한 개의 레코드만 가져와서 컬럼 확인
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 에러:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n✅ 사용 가능한 컬럼들:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${col} (${type}): ${value === null ? 'null' : value.toString().substring(0, 50)}`);
      });
      
      console.log('\n🔍 주소 관련 컬럼 확인:');
      const addressColumns = columns.filter(col => 
        col.includes('address') || 
        col.includes('location') || 
        col.includes('postcode') ||
        col.includes('주소')
      );
      
      if (addressColumns.length > 0) {
        console.log('  발견된 주소 관련 컬럼:', addressColumns.join(', '));
      } else {
        console.log('  ⚠️ 주소 관련 컬럼이 없습니다.');
      }
    } else {
      console.log('⚠️ 등록된 데이터가 없습니다.');
    }
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

async function main() {
  await checkColumns();
  console.log('\n✨ 완료!');
}

main();