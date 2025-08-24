# Supabase 인증 간단 설정 가이드

## 개발 환경용 설정 (모든 보안 해제)

### 1. Authentication 설정
Dashboard > Authentication > Providers > Email:
- **Enable Email Provider**: ON ✅
- **Confirm email**: OFF ❌ (가장 중요!)
- **Enable email change confirmations**: OFF ❌
- **Secure email change**: OFF ❌

### 2. Authentication > Settings
- **Enable email confirmations**: OFF ❌
- **Enable phone confirmations**: OFF ❌

### 3. 모든 RLS 비활성화
SQL Editor에서:
```sql
-- 모든 테이블 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations DISABLE ROW LEVEL SECURITY;
```

### 4. Storage 설정
각 버킷별로:
- **Public**: ON ✅
- **RLS**: 비활성화 (가능한 경우)

## 이렇게 하면:
- 회원가입 즉시 로그인 가능
- 이메일 확인 불필요
- 파일 업로드 자유롭게 가능
- 모든 데이터 접근 가능

## 주의사항
⚠️ 프로덕션 배포 전 반드시 보안 재설정 필요!