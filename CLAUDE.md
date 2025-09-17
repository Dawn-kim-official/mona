# CLAUDE.md - 프로젝트 가이드라인

## 🎨 색상 코드 가이드

### 브랜드 컬러
- **초록색 (Primary Green)**: `#02391f`
  - 사용처: 메인 브랜드 색상, 버튼, 강조 텍스트, 네비게이션 활성 상태
  - 기존 #1B4D3E 대체

- **노란색 (Primary Yellow)**: `#ffd020`  
  - 사용처: CTA 버튼, 하이라이트, 경고/주의 메시지
  - 기존 #FFC107, #FFB800 대체

### 색상 사용 규칙
1. 모든 초록색 계열은 `#02391f` 사용
2. 모든 노란색 계열은 `#ffd020` 사용
3. hover 상태는 opacity 또는 brightness 조정으로 처리
4. 새로운 컴포넌트 추가 시 위 색상 코드만 사용

## 📝 프로젝트 정보

### 프로젝트명
- Mona B2B 기부 플랫폼

### 주요 기능
- 기업 기부 관리
- 수혜기관 매칭
- 견적 및 픽업 관리
- ESG 리포트 생성

## 🔧 개발 환경

### 기술 스택
- Next.js 15.4.7
- React 19.1.0
- TypeScript
- Supabase (인증 및 DB)

### 테스트 명령어
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run lint` - 린트 검사
- `npm run typecheck` - 타입 체크 (없을 경우 tsc --noEmit)

## 📌 주의사항
- console.log 사용 금지 (프로덕션)
- 중복 API 호출 최소화
- 클라이언트 사이드 필터링 활용
- Link 컴포넌트 import 확인

## 최종 업데이트: 2025-09-17