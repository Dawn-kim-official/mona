# Supabase RLS 완전 비활성화 가이드

## Dashboard에서 직접 설정하기

### 1. Storage 설정
1. Supabase Dashboard > Storage
2. 각 버킷 클릭 (business-licenses, donation-photos 등)
3. "Configuration" 탭
4. "RLS enabled" 토글을 **OFF**로 변경
5. "Public" 토글을 **ON**으로 변경

### 2. Database 테이블 설정
1. Supabase Dashboard > Table Editor
2. 각 테이블 클릭 (profiles, businesses, donations 등)
3. 우측 상단 "..." 메뉴 > "Edit Table"
4. "Enable Row Level Security (RLS)" 체크박스 **해제**
5. Save

### 3. SQL Editor에서 한번에 처리
```sql
-- 모든 public 테이블 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations DISABLE ROW LEVEL SECURITY;

-- 스토리지 버킷 public 설정
UPDATE storage.buckets SET public = true;
```

## 주의사항
⚠️ 개발 환경에서만 사용하세요!
프로덕션에서는 반드시 RLS를 활성화해야 합니다.