# 📊 데이터베이스 접근 패턴 상세 분석

> **목적:** RLS 정책 설계를 위한 모든 데이터베이스 접근 패턴 문서화

---

## 📋 테이블 목록

### Core Tables:
1. **profiles** - 사용자 인증 및 역할 관리
2. **businesses** - 기업/기부자 정보
3. **beneficiaries** - 수혜기관 정보
4. **donations** - 기부 목록
5. **donation_matches** - 기부-수혜기관 매칭
6. **quotes** - 견적서
7. **pickup_schedules** - 픽업 일정
8. **reports** - ESG 리포트
9. **notifications** - 알림

### Storage Buckets:
1. **business-licenses** - 사업자등록증
2. **beneficiary-docs** - 수혜기관 증빙서류
3. **donation-photos** - 기부물품 사진
4. **donation-images** - 수령 확인 사진
5. **donation-receipts** - 기부 영수증
6. **esg-reports** - ESG 리포트 파일

---

## 🔑 Role별 접근 패턴

### 👤 ADMIN ROLE

#### READ 작업:
| 테이블 | 범위 | 파일 위치 |
|--------|------|-----------|
| profiles | 전체 | admin/layout.tsx:33-37 |
| businesses | 전체 | admin/businesses/page.tsx:38, api/admin/members/route.ts:38 |
| beneficiaries | 전체 | admin/businesses/page.tsx:42, api/admin/members/route.ts:42 |
| donations | 전체 | admin/donations/page.tsx:75 |
| donation_matches | 전체 | admin/donation/[id]/matches/page.tsx:62 |
| quotes | 전체 | admin/quotes/page.tsx:30 |
| reports | 전체 | admin/reports/page.tsx:42 |
| pickup_schedules | 전체 | admin/donation/[id]/detail/page.tsx:120 |

#### WRITE 작업:
| 테이블 | 작업 | 파일 위치 |
|--------|------|-----------|
| businesses | status 승인/거절 | admin/businesses/page.tsx:112 |
| beneficiaries | status 승인/거절 | admin/businesses/page.tsx:174 |
| donations | status 변경 | admin/donations/page.tsx:140, 158, 173 |
| donation_matches | 매칭 생성 (제안) | admin/donation/[id]/propose/page.tsx:156-183 |
| quotes | 견적서 생성/수정 | admin/donation/[id]/quote/page.tsx:217-334 |
| pickup_schedules | 픽업 일정 생성 | admin/donation/[id]/pickup/page.tsx:65 |
| reports | ESG 리포트 생성 | admin/reports/page.tsx:133 |

#### DELETE 작업:
| 테이블 | 파일 위치 |
|--------|-----------|
| donations | admin/donations/page.tsx:188 |
| reports | admin/reports/page.tsx:87 |

---

### 🏢 BUSINESS ROLE

#### READ 작업:
| 테이블 | 범위 | 필터 | 파일 위치 |
|--------|------|------|-----------|
| businesses | 본인만 | user_id = auth.uid() | business/layout.tsx:35 |
| donations | 본인 기부만 | business_id IN (본인 business) | business/donations/page.tsx:69 |
| donation_matches | 본인 기부의 매칭 | donation_id IN (본인 기부) | business/donations/page.tsx:82 |
| quotes | 본인 기부의 견적 | donation_id IN (본인 기부) | business/donations/page.tsx:106 |
| pickup_schedules | 본인 기부의 픽업 | donation_id IN (본인 기부) | business/donation/[id]/DonationDetailClient.tsx:93 |
| reports | 본인 ESG 리포트 | business_id = (본인) | business/dashboard/page.tsx:78 |

#### WRITE 작업:
| 테이블 | 작업 | 파일 위치 |
|--------|------|-----------|
| businesses | 프로필 수정 | business/profile/page.tsx:60 |
| donations | 기부 등록 | business/donation/new/page.tsx:143 |
| donations | 기부 수정 | business/donation/[id]/DonationDetailClient.tsx:143 |
| quotes | 견적 수락/거절 | business/donations/page.tsx:124, 140 |
| pickup_schedules | 픽업 일정 등록 | business/donation/[id]/pickup-schedule/page.tsx:78 |
| notifications | 알림 생성 | business/donation/[id]/pickup-schedule/page.tsx:89 |

---

### 🤝 BENEFICIARY ROLE

#### READ 작업:
| 테이블 | 범위 | 필터 | 파일 위치 |
|--------|------|------|-----------|
| beneficiaries | 본인만 | user_id = auth.uid() | beneficiary/layout.tsx:75 |
| donation_matches | 본인 제안만 | beneficiary_id = (본인) | beneficiary/proposals/page.tsx:88 |
| donations | 매칭된 기부만 | id IN (매칭된 donation_id) | beneficiary/proposal/[id]/page.tsx:107 |
| **businesses** | 매칭된 기부의 기업 | **크로스 조인** | beneficiary/proposal/[id]/page.tsx:107-113 |
| quotes | 매칭된 기부의 견적 | donation_id IN (매칭된) | beneficiary/proposals/page.tsx:113 |
| pickup_schedules | 매칭된 기부의 픽업 | donation_id IN (매칭된) | beneficiary/proposal/[id]/page.tsx:140 |

#### WRITE 작업:
| 테이블 | 작업 | 파일 위치 |
|--------|------|-----------|
| beneficiaries | 프로필 수정 | beneficiary/profile/page.tsx:81, api/beneficiary/update-profile/route.ts:29 |
| donation_matches | 제안 수락/거절 | beneficiary/proposal/[id]/page.tsx:205 |
| donation_matches | 수령 확인 | beneficiary/proposal/[id]/page.tsx:885 |
| donations | remaining_quantity 감소 | beneficiary/proposal/[id]/page.tsx:223 |

---

## 🔥 크로스 역할 접근 (Critical!)

### 1. Beneficiary → Business (읽기)

**시나리오:** 수혜기관이 매칭된 기부의 기업 정보 조회

**쿼리 패턴:**
```typescript
// beneficiary/proposal/[id]/page.tsx:107-113
const { data: donation } = await supabase
  .from('donations')
  .select(`
    *,
    businesses (
      name,
      address,
      phone,
      representative_name,
      email
    )
  `)
  .eq('id', donationId)
  .single()
```

**RLS 요구사항:**
- Beneficiary가 `businesses` 테이블을 직접 읽을 수 있어야 함
- 단, **매칭된 기부의 business만** 읽기 가능
- `donation_matches` → `donations` → `businesses` 조인 경로

**정책:**
```sql
CREATE POLICY "Beneficiaries can read matched businesses"
ON businesses FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT d.business_id
    FROM donations d
    JOIN donation_matches dm ON d.id = dm.donation_id
    JOIN beneficiaries b ON dm.beneficiary_id = b.id
    WHERE b.user_id = auth.uid()
  )
);
```

---

### 2. Admin → 모든 테이블 (매칭 생성)

**시나리오:** Admin이 임의의 기부와 수혜기관을 매칭

**쿼리 패턴:**
```typescript
// admin/donation/[id]/propose/page.tsx:152-184
// 여러 수혜기관 동시 매칭 가능
const matchesToInsert = selectedBeneficiaries.map(ben => ({
  donation_id: donationId,
  beneficiary_id: ben.id,
  proposed_quantity: ben.quantity,
  status: 'proposed'
}))

await supabase
  .from('donation_matches')
  .insert(matchesToInsert)
```

**RLS 요구사항:**
- Admin은 어떤 donation_id와 beneficiary_id 조합이든 INSERT 가능
- Admin은 donations.status를 'matched'로 변경 가능

---

### 3. Business ← donation_matches (읽기)

**시나리오:** 기업이 자기 기부의 매칭 상태 조회

**쿼리 패턴:**
```typescript
// business/donations/page.tsx:82
const { data: matches } = await supabase
  .from('donation_matches')
  .select('*')
  .eq('donation_id', donationId)
```

**RLS 요구사항:**
- Business는 본인 기부의 donation_matches 읽기 가능
- `donations.business_id` 확인 필요

---

## 📦 Foreign Key 관계

### 1:1 관계

```
auth.users.id (1) ←→ (1) profiles.id
profiles.id (1) ←→ (1) businesses.user_id
profiles.id (1) ←→ (1) beneficiaries.user_id
```

### Many:1 관계

```
donations.business_id (N) → (1) businesses.id
donation_matches.donation_id (N) → (1) donations.id
donation_matches.beneficiary_id (N) → (1) beneficiaries.id
quotes.donation_id (N) → (1) donations.id
pickup_schedules.donation_id (N) → (1) donations.id
reports.business_id (N) → (1) businesses.id
```

### 복잡한 조인 경로

**Beneficiary → Business 경로:**
```
beneficiaries (본인)
  ← donation_matches.beneficiary_id
    ← donation_matches.donation_id
      ← donations.id
        ← donations.business_id
          → businesses.id (읽기 대상)
```

---

## 🔄 Workflow별 접근 패턴

### Workflow 1: 기부 등록 → 매칭 → 수락

1. **Business: 기부 등록**
   - INSERT donations (business_id = 본인)
   - UPLOAD donation-photos

2. **Admin: 기부 승인**
   - UPDATE donations.status = 'approved'

3. **Admin: 수혜기관 매칭 (여러 곳)**
   - SELECT beneficiaries (전체 조회)
   - INSERT donation_matches (여러 건)
   - UPDATE donations.status = 'matched'

4. **Beneficiary: 제안 조회**
   - SELECT donation_matches WHERE beneficiary_id = 본인
   - SELECT donations (매칭된 것)
   - **SELECT businesses (크로스 조인)** ← 핵심!

5. **Beneficiary: 제안 수락**
   - UPDATE donation_matches.status = 'accepted'
   - UPDATE donations.remaining_quantity (감소)

---

### Workflow 2: 견적 → 수락 → 픽업

1. **Admin: 견적서 생성**
   - INSERT quotes
   - UPDATE donation_matches.status = 'quote_sent'

2. **Business: 견적 확인**
   - SELECT quotes WHERE donation_id IN (본인 기부)

3. **Business: 견적 수락**
   - UPDATE quotes.status = 'accepted'

4. **Business: 픽업 일정 등록**
   - INSERT pickup_schedules
   - UPDATE donations.status = 'pickup_scheduled'

5. **Beneficiary: 픽업 정보 조회**
   - SELECT pickup_schedules (매칭된 기부의)

---

### Workflow 3: 수령 확인 → 완료

1. **Beneficiary: 수령 확인**
   - UPLOAD donation-images
   - UPLOAD donation-receipts
   - UPDATE donation_matches.received_at

2. **Admin: 완료 처리**
   - UPDATE donations.status = 'completed'

---

## 🔐 Service Role Key 사용 위치

### 서버 사이드만 (안전)

| 파일 | 용도 |
|------|------|
| `src/lib/supabase-admin.ts` | Admin 전용 클라이언트 |
| `src/app/api/admin/members/route.ts:12` | Admin API - 전체 회원 조회 |
| `src/app/api/admin/users/route.ts:32` | Admin API - 사용자 이메일 조회 |

**특징:**
- RLS를 **완전히 우회**
- 서버 사이드에서만 실행
- `SUPABASE_SERVICE_ROLE_KEY` 환경변수 사용

### 클라이언트 사이드 (위험 - 제거 필요)

| 파일 | 문제 |
|------|------|
| `src/lib/supabase.ts:18-32` | ❌ createAdminClient() 함수 존재 |
| `src/app/admin/businesses/page.tsx:4` | ❌ import되어 있음 (미사용) |

**제거 대상:**
- `createAdminClient()` 함수 삭제
- import 제거

---

## 📈 성능 고려사항

### 인덱스 필요 컬럼

RLS 정책에서 자주 조회되는 컬럼:

```sql
-- User 관계
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);

-- Foreign Keys
CREATE INDEX idx_donations_business_id ON donations(business_id);
CREATE INDEX idx_donation_matches_donation_id ON donation_matches(donation_id);
CREATE INDEX idx_donation_matches_beneficiary_id ON donation_matches(beneficiary_id);
CREATE INDEX idx_quotes_donation_id ON quotes(donation_id);
CREATE INDEX idx_pickup_schedules_donation_id ON pickup_schedules(donation_id);
CREATE INDEX idx_reports_business_id ON reports(business_id);

-- Role 확인용
CREATE INDEX idx_profiles_role ON profiles(role);

-- Status 필터용
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donation_matches_status ON donation_matches(status);
```

---

## 🎯 RLS 정책 설계 원칙

### 1. 읽기 정책 (SELECT)
- **USING 절**: 어떤 행을 볼 수 있는가?
- 여러 정책이 있으면 **OR** 조건 (PERMISSIVE)

### 2. 쓰기 정책 (INSERT/UPDATE/DELETE)
- **WITH CHECK 절**: 어떤 값으로 쓸 수 있는가?
- INSERT: WITH CHECK만
- UPDATE: USING + WITH CHECK
- DELETE: USING만

### 3. 정책 우선순위
- Service Role Key: 모든 RLS 우회
- Authenticated User: 정책 적용
- Anon: 정책 적용 (또는 차단)

### 4. 정책 테스트 방법
```sql
-- 특정 사용자로 테스트
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid';
SELECT * FROM donations;  -- RLS 적용됨
RESET role;
```

---

## 📊 테이블별 복잡도

| 테이블 | 정책 수 | 복잡도 | 이유 |
|--------|---------|--------|------|
| profiles | 3 | 🟢 낮음 | 단순 self-access |
| reports | 4 | 🟢 낮음 | Admin 전용 |
| notifications | 5 | 🟢 낮음 | 단순 user_id 필터 |
| businesses | 6 | 🟡 중간 | **Beneficiary 크로스 조인** |
| beneficiaries | 5 | 🟢 낮음 | 단순 |
| pickup_schedules | 6 | 🟡 중간 | 다중 역할 접근 |
| quotes | 6 | 🟡 중간 | 다중 역할 접근 |
| donations | 8 | 🔴 높음 | 3자 접근 + quantity 수정 |
| donation_matches | 6 | 🔴 높음 | **핵심 매칭 로직** |

---

## 🚨 Critical Paths (반드시 테스트)

### 1. Beneficiary → Business 정보 조회
```sql
-- 이 쿼리가 성공해야 함
SELECT d.*, b.*
FROM donation_matches dm
JOIN donations d ON dm.donation_id = d.id
JOIN businesses b ON d.business_id = b.id
WHERE dm.beneficiary_id = [본인]
```

### 2. Admin → 다중 매칭 생성
```sql
-- 여러 건이 한 번에 INSERT되어야 함
INSERT INTO donation_matches (donation_id, beneficiary_id, ...)
VALUES
  (uuid1, uuid2, ...),
  (uuid1, uuid3, ...),
  (uuid1, uuid4, ...);
```

### 3. Beneficiary → Quantity 감소
```sql
-- remaining_quantity만 감소해야 함
UPDATE donations
SET remaining_quantity = remaining_quantity - 10
WHERE id = [매칭된 기부]
```

---

**분석 완료일:** 2025-10-30
**파일 참조:** 51개 파일 분석
**쿼리 패턴:** 200+ 개 확인
