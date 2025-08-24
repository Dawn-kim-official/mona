# Supabase 프로젝트 재설정 가이드

## 문제
현재 Supabase URL (https://ipieplfljolfssmvxpub.supabase.co)이 404를 반환하고 있습니다.
프로젝트가 삭제되었거나 URL이 변경된 것으로 보입니다.

## 해결 방법

### 1. 새 Supabase 프로젝트 생성
1. https://supabase.com 에 로그인
2. "New Project" 클릭
3. 프로젝트 이름: "mona-b2b" (또는 원하는 이름)
4. 데이터베이스 비밀번호 설정
5. Region: Northeast Asia (Seoul) 선택

### 2. 환경 변수 업데이트
프로젝트 생성 후:
1. Settings > API 로 이동
2. 다음 값들을 복사:
   - Project URL (예: https://xxxxx.supabase.co)
   - anon public key
   - service_role key

3. `.env.local` 파일 업데이트:
```
NEXT_PUBLIC_SUPABASE_URL=새로운_프로젝트_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=새로운_anon_key
SUPABASE_SERVICE_ROLE_KEY=새로운_service_role_key
```

### 3. 데이터베이스 마이그레이션
SQL Editor에서 순서대로 실행:
1. `/supabase/migrations/20240119_initial_schema.sql`
2. `/supabase/migrations/20240119_storage_buckets.sql`
3. `/supabase/disable-all-rls.sql` (개발용)

### 4. 테스트 계정 생성
1. Authentication > Users > Invite User
2. 테스트 계정 생성:
   - test@test.com / 123123
   - admin@test.com / 123123

### 5. 프로필 설정
SQL Editor에서:
```sql
-- test@test.com을 business로 설정
UPDATE profiles SET role = 'business' WHERE email = 'test@test.com';

-- admin@test.com을 admin으로 설정  
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

## 확인
- http://localhost:3000/test-login 에서 로그인 테스트
- 정상 작동하면 다른 페이지들도 확인