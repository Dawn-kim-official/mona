# Supabase 이메일 인증 비활성화 방법

## 1. Supabase Dashboard에서 설정 변경

1. https://supabase.com 로그인
2. 프로젝트 선택
3. **Authentication > Providers** 로 이동
4. **Email** 섹션에서:
   - `Enable Email Confirmations` 토글을 **OFF**로 변경
   - `Enable email provider` 는 ON 상태 유지

## 2. 추가 설정 (선택사항)

**Authentication > Settings** 에서:
- `Confirm email` 토글 OFF
- `Enable email change confirmations` 토글 OFF

## 3. 테스트 도메인 허용 (선택사항)

만약 여전히 문제가 있다면:
1. **Authentication > Settings > Security**
2. `Allowed email domains` 에 다음 추가:
   - `test.com`
   - `example.com`
   - 또는 비워두기 (모든 도메인 허용)

## 변경 후

- 회원가입 시 이메일 확인 없이 바로 사용 가능
- test@test.com 같은 테스트 이메일도 사용 가능
- 프로덕션 배포 전에는 다시 활성화 필요

## 주의사항

⚠️ 이 설정은 개발 환경에서만 사용하세요!
프로덕션에서는 보안을 위해 이메일 인증을 반드시 활성화해야 합니다.