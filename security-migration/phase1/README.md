# 🚨 Phase 1: 긴급 보안 조치

> **목표:** 치명적 취약점 즉시 제거 (기능 영향 최소화)

---

## ⏱️ 예상 소요 시간
**2-3시간** (테스트 포함)

---

## 🎯 작업 목표

### 1. ❌ SERVICE_ROLE_KEY 클라이언트 노출 제거
**위험도:** 🔴 치명적
**영향:** 없음 (사용하지 않는 코드 제거)

### 2. ✅ Beneficiary API 인증 추가
**위험도:** 🟡 중간
**영향:** 없음 (같은 엔드포인트 유지)

---

## 📋 작업 순서

### Step 1: Git 백업 (5분)

```bash
# 현재 상태 커밋
cd /Users/tagryu/PJT/mona
git add .
git commit -m "Pre-phase1: Checkpoint before security fixes"

# 백업 브랜치 생성
git checkout -b backup-before-phase1
git checkout main
```

---

### Step 2: SERVICE_ROLE_KEY 제거 (30분)

#### 2.1 삭제할 코드

**파일: `src/lib/supabase.ts`**

```typescript
// ❌ 삭제: 18-32줄
// 어드민용 클라이언트 (RLS 우회용)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase service role key, falling back to anon client')
    return createClient()
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseServiceKey
  )
}
```

**전체 파일이 이렇게 되어야 함:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './supabase-types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// createAdminClient 함수 완전 삭제됨
```

#### 2.2 import 제거

**파일: `src/app/admin/businesses/page.tsx`**

```typescript
// 변경 전 (4줄)
import { createClient, createAdminClient } from '@/lib/supabase'

// 변경 후
import { createClient } from '@/lib/supabase'
```

**확인:** 이 파일에서 `createAdminClient()`를 실제로 호출하지 않음 → 안전

---

### Step 3: Beneficiary API 인증 추가 (1시간)

#### 3.1 현재 코드 (취약)

**파일: `src/app/api/beneficiary/update-profile/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, updateData } = body  // ⚠️ 클라이언트에서 userId 받음

    if (!userId || !updateData) {
      return NextResponse.json({ error: 'User ID and update data required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Updating beneficiary profile for user:', userId)
    console.log('Update data:', updateData)

    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updateData)
      .eq('user_id', userId)  // ⚠️ 클라이언트가 보낸 userId 사용
      .select()

    if (error) {
      console.error('Error updating beneficiary profile:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**문제점:**
1. ❌ 인증 없음 - 누구나 호출 가능
2. ❌ userId를 클라이언트에서 받음 - 다른 사람 프로필 수정 가능
3. ❌ Role 검증 없음 - Business도 호출 가능

#### 3.2 수정된 코드 (보안)

**새로운 내용:**

```typescript
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function PUT(request: Request) {
  try {
    // ✅ 1. 인증 확인
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ 2. Beneficiary 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'beneficiary') {
      return NextResponse.json({ error: 'Beneficiary access required' }, { status: 403 })
    }

    // ✅ 3. updateData만 받음 (userId는 인증된 user.id 사용)
    const body = await request.json()
    const { updateData } = body

    if (!updateData) {
      return NextResponse.json({ error: 'Update data required' }, { status: 400 })
    }

    // ✅ 4. 본인 데이터만 수정
    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updateData)
      .eq('user_id', user.id)  // ✅ 인증된 user.id 사용
      .select()

    if (error) {
      console.error('Error updating beneficiary profile:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**변경 사항:**
1. ✅ `createServerComponentClient()` 사용 (세션 포함)
2. ✅ `supabase.auth.getUser()` 인증 확인
3. ✅ `profiles.role` 확인 (beneficiary만 허용)
4. ✅ 서버에서 `user.id` 사용 (클라이언트 userId 무시)

#### 3.3 클라이언트 코드 확인

**파일: `src/app/beneficiary/profile/page.tsx:81`**

기존 클라이언트 코드:
```typescript
const response = await fetch('/api/beneficiary/update-profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,      // ← 이 부분은 이제 무시됨 (서버가 auth.uid() 사용)
    updateData: {
      organization_name,
      representative_name,
      phone,
      address,
      registration_number,
      // ...
    }
  })
})
```

**변경 필요 여부:** ❌ 아니오
- 클라이언트 코드는 그대로 두어도 됨
- 서버가 `userId`를 무시하고 `auth.uid()` 사용
- 하지만 깔끔하게 하려면 `userId` 제거 가능 (선택사항)

**선택사항: 클라이언트 정리**
```typescript
const response = await fetch('/api/beneficiary/update-profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // userId 삭제됨 - 서버가 세션에서 가져옴
    updateData: {
      organization_name,
      representative_name,
      // ...
    }
  })
})
```

---

### Step 4: 빌드 테스트 (10분)

```bash
# TypeScript 타입 체크
npm run build

# 에러 확인
# - createAdminClient import 에러 없는지
# - 다른 타입 에러 없는지
```

**예상 결과:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

---

### Step 5: 로컬 테스트 (30분)

```bash
npm run dev
```

#### 5.1 Admin 테스트
1. [ ] Admin 로그인
2. [ ] 대시보드 접속
3. [ ] 회원 목록 조회
4. [ ] 기부 목록 조회

**예상 결과:** 모든 기능 정상 작동

#### 5.2 Business 테스트
1. [ ] Business 로그인
2. [ ] 대시보드 접속
3. [ ] 기부 목록 조회
4. [ ] 프로필 수정

**예상 결과:** 모든 기능 정상 작동

#### 5.3 Beneficiary 테스트 (중요!)
1. [ ] Beneficiary 로그인
2. [ ] 대시보드 접속
3. [ ] 제안 목록 조회
4. [ ] **프로필 수정** ← 핵심 테스트!
   - 조직명 변경
   - 전화번호 변경
   - 저장 버튼 클릭
   - 성공 메시지 확인
   - 페이지 새로고침 → 변경 내용 유지 확인

**예상 결과:** 프로필 수정 정상 작동

#### 5.4 보안 테스트 (중요!)

**Postman 또는 curl로 테스트:**

```bash
# 인증 없이 API 호출 시도 (실패해야 함)
curl -X PUT http://localhost:3000/api/beneficiary/update-profile \
  -H "Content-Type: application/json" \
  -d '{
    "updateData": {
      "organization_name": "해킹 시도"
    }
  }'

# 예상 응답: {"error":"Unauthorized"} (401)
```

**브라우저 콘솔에서 테스트:**

```javascript
// Beneficiary로 로그인한 상태에서
// 다른 사람의 userId를 시도 (실패해야 함)
fetch('/api/beneficiary/update-profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '다른-사람-uuid',  // ← 이건 무시됨
    updateData: {
      organization_name: '해킹 시도'
    }
  })
})
.then(r => r.json())
.then(console.log)

// 예상: 본인 프로필만 수정됨 (다른 사람 것은 수정 안 됨)
```

---

### Step 6: Git 커밋 (5분)

```bash
git add .
git commit -m "Phase 1: Emergency security fixes

- Remove createAdminClient() from client-side code
- Add authentication to beneficiary API endpoint
- Verify user role before profile updates
- Use server-side user.id instead of client-provided userId

Security improvements:
- Prevent SERVICE_ROLE_KEY exposure
- Block unauthorized API access
- Enforce role-based access control"

git push origin main
```

---

### Step 7: 배포 (10분)

**Vercel 또는 배포 플랫폼에서:**
1. Git push 후 자동 배포 대기
2. 배포 완료 확인
3. 프로덕션 URL에서 테스트 반복

**프로덕션 테스트 체크리스트:**
- [ ] Admin 로그인
- [ ] Business 로그인
- [ ] Beneficiary 로그인
- [ ] Beneficiary 프로필 수정
- [ ] 모든 페이지 정상 작동

---

## ✅ 완료 체크리스트

### 코드 변경
- [ ] `src/lib/supabase.ts` - createAdminClient() 삭제
- [ ] `src/app/admin/businesses/page.tsx` - import 수정
- [ ] `src/app/api/beneficiary/update-profile/route.ts` - 인증 추가

### 테스트
- [ ] 빌드 성공
- [ ] Admin 기능 테스트
- [ ] Business 기능 테스트
- [ ] Beneficiary 기능 테스트 (특히 프로필 수정)
- [ ] 보안 테스트 (무인증 요청 차단 확인)

### 배포
- [ ] Git 커밋
- [ ] Git 푸시
- [ ] 프로덕션 배포
- [ ] 프로덕션 테스트

---

## 🔄 롤백 방법

### 코드 롤백
```bash
git revert HEAD
git push origin main
```

### 특정 파일만 롤백
```bash
git checkout backup-before-phase1 -- src/lib/supabase.ts
git checkout backup-before-phase1 -- src/app/api/beneficiary/update-profile/route.ts
git commit -m "Rollback phase 1 changes"
git push origin main
```

---

## 🎉 성공 기준

### 기능 테스트
- ✅ 모든 사용자 역할 로그인 가능
- ✅ 모든 기존 기능 정상 작동
- ✅ Beneficiary 프로필 수정 정상 작동

### 보안 테스트
- ✅ 무인증 API 요청 차단됨 (401 에러)
- ✅ 다른 사용자 데이터 수정 불가
- ✅ Role 확인 작동 (Business는 beneficiary API 호출 불가)

---

## 📊 예상 결과

### 보안 개선
- 🔒 SERVICE_ROLE_KEY 클라이언트 노출 차단
- 🔒 Beneficiary API 인증 추가
- 🔒 Role 기반 접근 제어 강화

### 기능 영향
- ✅ **기능 변화 없음**
- ✅ 모든 기존 워크플로우 정상 작동
- ✅ 사용자 경험 동일

---

## 📞 문제 발생 시

### 빌드 실패
1. TypeScript 에러 확인
2. import 경로 확인
3. 필요 시 타입 정의 추가

### API 호출 실패
1. 네트워크 탭에서 응답 확인
2. 401 에러: 세션 확인
3. 403 에러: Role 확인
4. 500 에러: 서버 로그 확인

### 기능 오류
1. 즉시 롤백 (위의 롤백 방법 사용)
2. 로컬에서 재테스트
3. 원인 파악 후 재시도

---

## 🎯 다음 단계

Phase 1 완료 후:
- **Phase 2-3:** RLS 정책 SQL 파일 검토
- **Phase 4:** 단계별 RLS 적용 시작

---

**작성일:** 2025-10-30
**예상 소요 시간:** 2-3시간
**위험도:** 🟢 낮음 (기능 영향 최소)
