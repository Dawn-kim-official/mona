# MONA B2B 개발 노트

## 주요 디자인 결정사항

### 1. 아키텍처
- **프론트엔드**: Next.js App Router 사용
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **스타일링**: Inline styles (Tailwind 대신 직접 스타일 적용)
- **타입 안전성**: TypeScript 전체 적용

### 2. 라우팅 구조
```
/login - 로그인
/signup - 회원가입
/business/
  - dashboard - 비즈니스 대시보드
  - registration - 사업자 등록
  - donation/new - 기부 등록
/admin/
  - dashboard - 관리자 대시보드
  - businesses - 사업자 관리
  - donations - 기부 관리
  - quotes - 견적 관리
```

### 3. 상태 관리 전략
- 서버 컴포넌트 최대한 활용
- 클라이언트 상태는 useState로 관리
- 인증 상태는 Supabase Auth 활용

### 4. 데이터베이스 스키마 특징
- UUID 기반 ID 사용
- created_at, updated_at 자동 관리
- ENUM 타입으로 상태 관리
- JSON 타입으로 유연한 데이터 저장

## 트러블슈팅 기록

### 1. Supabase 사용자 생성 오류
**문제**: "Database error creating new user"
**원인**: auth.users 테이블의 트리거가 profiles 테이블 생성 시 충돌
**해결**: 
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

### 2. 400 Bad Request 오류
**문제**: 로그인 시 400 에러 발생
**원인**: RLS 정책이 너무 제한적
**임시 해결**: 개발 중 RLS 비활성화
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### 3. 미들웨어 리다이렉트 문제
**문제**: /ko 경로로 자동 리다이렉트
**원인**: next-intl 미들웨어 설정
**해결**: middleware.ts에서 국제화 코드 주석 처리

## 코딩 컨벤션

### 1. 네이밍
- 컴포넌트: PascalCase (예: BusinessDashboard)
- 함수: camelCase (예: handleSubmit)
- 상수: UPPER_SNAKE_CASE (예: API_URL)

### 2. 스타일링
- inline styles 사용
- 색상은 globals.css의 CSS 변수 참조
- 반복되는 스타일은 객체로 분리

### 3. 타입 정의
- Supabase 자동 생성 타입 활용
- 필요시 interface로 확장

## 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용 예정
- Storage에 업로드 시 리사이징 고려

### 2. 데이터 페칭
- 필요한 필드만 select
- 페이지네이션 구현 필요

### 3. 번들 사이즈
- 동적 import 활용
- 불필요한 의존성 제거

## 보안 고려사항

### 1. 인증
- Supabase Auth 활용
- JWT 토큰 자동 관리
- 역할 기반 접근 제어

### 2. 데이터 접근
- RLS 정책 필수 (현재 개발용으로 비활성화)
- Service Role Key는 서버에서만 사용

### 3. 파일 업로드
- 파일 타입 검증
- 파일 크기 제한
- 악성 코드 스캔 (추후 구현)

## 향후 개선사항

### 1. 테스트
- Jest + React Testing Library 설정
- E2E 테스트 (Cypress/Playwright)
- API 모킹

### 2. CI/CD
- GitHub Actions 설정
- 자동 배포 파이프라인
- 환경별 설정 분리

### 3. 모니터링
- Sentry 에러 트래킹
- Analytics 연동
- 성능 모니터링

### 4. 접근성
- ARIA 레이블 추가
- 키보드 네비게이션
- 스크린 리더 지원