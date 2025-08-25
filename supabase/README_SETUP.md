# Supabase 데이터베이스 설정 가이드

다음 SQL 파일들을 순서대로 실행해주세요:

## 1. 기본 테이블 생성
1. `create-profiles-table.sql` - 사용자 프로필 테이블
2. `create-businesses-table.sql` - 사업자 정보 테이블
3. `create-donations-table.sql` - 기부 정보 테이블
4. `add-donation-fields.sql` - 기부 테이블 추가 필드

## 2. 스토리지 설정
1. `setup-storage-buckets.sql` - 스토리지 버킷 생성

## 3. 추가 기능 테이블
1. `create-quotes-table.sql` - 견적서 테이블 생성 ⭐️ 중요!
2. `add-pickup-time-to-quotes.sql` - 견적서에 픽업 시간 필드 추가
3. `create-pickup-schedules-table.sql` - 픽업 일정 테이블
4. `add-esg-report-field.sql` - ESG 리포트 필드 추가

## 4. 어드민 계정 설정
1. 회원가입 페이지에서 `admin@mona.com`으로 가입
2. `setup-admin-simple.sql` 실행하여 어드민 권한 부여

## 5. RLS 정책 (선택사항)
- 개발 중: `disable-all-rls.sql`
- 프로덕션: `enable-rls-production.sql`

## 견적서 발송이 안 될 때
1. quotes 테이블이 생성되었는지 확인
2. `create-quotes-table.sql` 실행
3. `add-pickup-time-to-quotes.sql` 실행