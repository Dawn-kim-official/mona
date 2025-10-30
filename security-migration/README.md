# 🛡️ Mona B2B 플랫폼 보안 강화 마스터 플랜

## 📋 목표
**"기존 기능을 100% 보존하면서 데이터베이스 레벨 보안 추가"**

---

## 🎯 핵심 원칙

1. **무중단 배포** - 단계별 점진적 적용
2. **기능 보존 최우선** - 모든 단계에서 기능 테스트 필수
3. **롤백 가능** - 각 단계마다 되돌리기 방법 준비
4. **독특한 3자 구조 고려** - Admin/Business/Beneficiary 교차 접근 완벽 지원

---

## 🚨 현재 보안 상황

### 심각도: **HIGH (높음)**

### 주요 취약점:
1. ❌ **SERVICE_ROLE_KEY가 클라이언트 코드에 노출** (치명적)
2. ❌ **RLS(Row Level Security) 정책 없음** (심각)
3. ❌ **일부 API 라우트 인증 없음** (중간)
4. ⚠️ **클라이언트 사이드 검증에만 의존** (중간)

### 가능한 공격:
- 모든 테이블 데이터 탈취
- 다른 사용자 데이터 조작
- 관리자 권한 탈취
- 서비스 마비

---

## 📊 Phase별 작업 내용

### 📅 타임라인

| Phase | 작업 | 소요 시간 | 위험도 | 파일 |
|-------|------|-----------|--------|------|
| **Phase 0** | 백업 & 테스트 환경 | 1-2시간 | 🟢 낮음 | - |
| **Phase 1** | 긴급 조치 (배포 필수) | 2-3시간 | 🟢 낮음 | `phase1/` |
| **Phase 2-3** | RLS 정책 설계 & SQL 작성 | 1일 | 🟡 중간 | `sql/` |
| **Phase 4 Day 1** | 간단한 테이블 RLS 적용 | 4-6시간 | 🟢 낮음 | `sql/002-004` |
| **Phase 4 Day 2** | 핵심 테이블 RLS 적용 | 6-8시간 | 🟡 중간 | `sql/005-006` |
| **Phase 4 Day 3** | 복잡한 테이블 RLS 적용 | 6-8시간 | 🔴 높음 | `sql/007` |
| **Phase 4 Day 3 후반** | Storage buckets | 2-3시간 | 🟡 중간 | `sql/008` |
| **Phase 5-6** | 모니터링 (지속) | 지속 | 🟢 낮음 | `monitoring/` |

**총 소요 예상: 4-5일**

---

## 📂 파일 구조

```
security-migration/
├── README.md                           # 이 파일
├── SECURITY_ANALYSIS.md                # 상세 보안 분석 리포트
├── DATABASE_ACCESS_PATTERNS.md         # 데이터베이스 접근 패턴 분석
├── phase1/                             # Phase 1: 긴급 조치
│   ├── README.md                       # Phase 1 작업 가이드
│   ├── 001_remove_client_admin.md      # SERVICE_ROLE_KEY 제거 방법
│   └── 002_fix_beneficiary_api.md      # Beneficiary API 보안 패치
├── sql/                                # SQL 마이그레이션 파일
│   ├── 002_policies_profiles.sql       # profiles 테이블 정책
│   ├── 003_policies_simple_tables.sql  # reports, notifications 정책
│   ├── 004_policies_users.sql          # businesses, beneficiaries 정책
│   ├── 005_policies_donations.sql      # donations 테이블 정책
│   ├── 006_policies_matches.sql        # donation_matches 정책 (핵심)
│   ├── 007_policies_quotes_pickup.sql  # quotes, pickup_schedules 정책
│   ├── 008_storage_policies.sql        # Storage bucket 정책
│   ├── 009_indexes.sql                 # 성능 최적화 인덱스
│   └── 999_rollback.sql                # 전체 롤백 스크립트
├── monitoring/                         # 모니터링 쿼리
│   ├── check_rls_status.sql            # RLS 상태 확인
│   ├── check_policies.sql              # 정책 목록 확인
│   └── performance_check.sql           # 성능 확인
└── tests/                              # 테스트 체크리스트
    ├── phase1_tests.md                 # Phase 1 테스트
    ├── phase4_day1_tests.md            # Day 1 테스트
    ├── phase4_day2_tests.md            # Day 2 테스트
    └── phase4_day3_tests.md            # Day 3 테스트
```

---

## 🚀 시작하기

### Phase 0: 사전 준비 (필수)

```bash
# 1. 현재 Git 상태 커밋
git add .
git commit -m "Pre-security-migration checkpoint"

# 2. 백업 브랜치 생성
git checkout -b backup-before-security-migration

# 3. 메인 브랜치로 돌아오기
git checkout main
```

**Supabase 백업:**
1. Supabase Dashboard 접속
2. Database → Backups → Create Backup

---

### Phase 1: 긴급 조치 (지금 시작)

👉 **[Phase 1 작업 가이드](./phase1/README.md)** 참조

**작업 내용:**
1. ✅ SERVICE_ROLE_KEY 클라이언트 노출 제거
2. ✅ Beneficiary API 인증 추가

**예상 시간:** 2-3시간
**위험도:** 🟢 낮음 (기능 영향 거의 없음)

---

### Phase 2-3: RLS 정책 준비

👉 **[SQL 마이그레이션 파일](./sql/)** 참조

모든 RLS 정책이 SQL 파일로 준비되어 있습니다.

---

### Phase 4: 단계별 RLS 적용

**Day 1:** 간단한 테이블
- profiles
- reports
- notifications

**Day 2:** 핵심 테이블
- businesses
- beneficiaries
- donations

**Day 3:** 복잡한 테이블
- donation_matches (가장 중요)
- quotes
- pickup_schedules
- Storage buckets

각 단계마다 **테스트 체크리스트** 완료 필수!

---

## 🔄 롤백 방법

### 즉시 롤백 (RLS 비활성화)

```sql
-- 모든 테이블 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

### Git 롤백

```bash
# Phase 1 이전으로 되돌리기
git checkout backup-before-security-migration

# 또는 특정 커밋으로
git revert <commit-hash>
```

**상세 롤백 스크립트:** `sql/999_rollback.sql`

---

## 🔥 특별 주의사항

### 1. Beneficiary ↔ Business 크로스 조인
Beneficiary가 매칭된 기부의 Business 정보를 볼 수 있어야 합니다.
- `businesses` 테이블에 특별 정책 필요
- **테스트 필수:** 제안 수락 후 Business 정보 조회

### 2. Admin의 매칭 생성
Admin이 임의의 Business 기부와 Beneficiary를 연결할 수 있어야 합니다.
- `donation_matches` INSERT 정책이 핵심
- **테스트 필수:** 여러 수혜기관 동시 매칭

### 3. Quantity 분할 기부
여러 Beneficiary가 하나의 기부를 나눠 받을 수 있습니다.
- `donations.remaining_quantity` 업데이트 정책 필요
- **테스트 필수:** 수량 초과 방지

### 4. Service Role 유지
Admin API routes는 계속 Service Role Key를 사용합니다.
- **서버 사이드에만** 존재 (`src/lib/supabase-admin.ts`)
- 클라이언트 파일에서는 완전 제거

---

## 📊 모니터링

### RLS 상태 확인
```sql
-- 테이블별 RLS 상태
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 정책 목록 확인
```sql
-- 적용된 정책 목록
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**상세 모니터링 쿼리:** `monitoring/` 디렉토리 참조

---

## ✅ 전체 체크리스트

### Phase 1 (긴급 - 당일)
- [ ] `createAdminClient()` 클라이언트 코드 삭제
- [ ] Beneficiary API 인증 추가
- [ ] 빌드 테스트
- [ ] 배포
- [ ] 기능 테스트 (Admin/Business/Beneficiary 로그인)

### Phase 2-3 (정책 작성 - 1일)
- [ ] 모든 테이블 RLS 정책 SQL 검토
- [ ] Storage bucket 정책 SQL 검토
- [ ] 테스트 환경에서 정책 검증

### Phase 4 (단계별 적용 - 2-3일)
- [ ] Day 1: profiles, reports, notifications
- [ ] Day 2: businesses, beneficiaries, donations
- [ ] Day 3: donation_matches, quotes, pickup_schedules
- [ ] Day 3 후반: Storage buckets
- [ ] 각 단계마다 전체 워크플로우 테스트

### Phase 5-6 (모니터링 - 지속)
- [ ] 인덱스 추가
- [ ] 성능 모니터링
- [ ] 접근 실패 로그 확인

---

## 📞 문제 발생 시

### 긴급 상황
1. 즉시 RLS 비활성화: `999_rollback.sql` 실행
2. Git 롤백: `git checkout backup-before-security-migration`
3. 로그 확인: Supabase Dashboard → Logs

### 성능 저하
1. `monitoring/performance_check.sql` 실행
2. 인덱스 확인 및 추가
3. 정책 최적화

### 기능 오류
1. 해당 테이블만 RLS 비활성화
2. 정책 재검토
3. 테스트 체크리스트 재수행

---

## 📚 참고 문서

- [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md) - 상세 보안 분석
- [DATABASE_ACCESS_PATTERNS.md](./DATABASE_ACCESS_PATTERNS.md) - DB 접근 패턴
- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)

---

**작성일:** 2025-10-30
**작성자:** Claude Code
**버전:** 1.0
