# 매칭 알림 팝업 설정 가이드

## 데이터베이스 마이그레이션

Supabase 대시보드에서 다음 SQL을 실행해주세요:

```sql
-- Add notification_confirmed_at to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS notification_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add notification_confirmed_at to donation_matches table  
ALTER TABLE public.donation_matches
ADD COLUMN IF NOT EXISTS notification_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_donations_notification_confirmed 
ON public.donations(notification_confirmed_at);

CREATE INDEX IF NOT EXISTS idx_donation_matches_notification_confirmed
ON public.donation_matches(notification_confirmed_at);
```

## 기능 설명

### 동작 방식
1. **기부기업**: 자신의 기부품이 수혜기관과 매칭되면 로그인 시 팝업 표시
2. **수혜기관**: 새로운 매칭 제안을 받으면 로그인 시 팝업 표시

### 팝업 특징
- 체크박스 체크 후에만 확인 버튼 활성화
- 확인하지 않으면 다른 기능 사용 불가 (화면 블록)
- 확인 후 다시 로그인해도 재표시 안됨
- 새로운 매칭이 발생하면 다시 표시

### 상태 저장
- `donations.notification_confirmed_at`: 기부기업의 확인 시간
- `donation_matches.notification_confirmed_at`: 수혜기관의 확인 시간

## 테스트 방법
1. 관리자로 로그인하여 기부품 매칭 진행
2. 기부기업 또는 수혜기관으로 로그인
3. 팝업이 표시되는지 확인
4. 체크박스 체크 후 확인 클릭
5. 팝업이 사라지고 정상 이용 가능한지 확인