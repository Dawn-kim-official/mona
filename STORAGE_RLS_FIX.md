# Storage RLS 문제 완전 해결 방법

## 1. Supabase Dashboard에서 Storage 설정

### Storage > Configuration
1. https://supabase.com 로그인
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. **Policies** 탭 클릭
5. 모든 정책 삭제:
   - 각 정책 옆 "..." 클릭 > Delete

### Storage > Buckets
1. **business-licenses** 버킷 클릭
2. **Configuration** 탭
3. 설정 변경:
   - **Public bucket**: ON ✅
   - **RLS enabled**: OFF ❌
4. Save

5. **donation-photos** 버킷도 동일하게 설정

## 2. SQL로 강제 설정

```sql
-- 1. 모든 스토리지 정책 삭제
DROP POLICY IF EXISTS "Business owners can upload own license" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can view own license" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all licenses" ON storage.objects;
DROP POLICY IF EXISTS "Business can upload donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Business can update own donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Business can delete own donation photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tax documents" ON storage.objects;
DROP POLICY IF EXISTS "Business can view own tax documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all tax documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload ESG reports" ON storage.objects;
DROP POLICY IF EXISTS "Business can view own ESG reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ESG reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload post donation media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post donation media" ON storage.objects;

-- 2. 기본 허용 정책 추가 (모든 작업 허용)
CREATE POLICY "Allow all" ON storage.objects
FOR ALL TO public
USING (true)
WITH CHECK (true);

-- 3. 버킷 설정 업데이트
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('business-licenses', 'donation-photos');
```

## 3. 확인 방법

SQL Editor에서:
```sql
-- RLS 상태 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage';

-- 정책 확인
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 버킷 상태 확인
SELECT * FROM storage.buckets;
```

## 주의사항
⚠️ 이 설정은 개발 환경에서만 사용하세요!
프로덕션에서는 적절한 RLS 정책을 설정해야 합니다.