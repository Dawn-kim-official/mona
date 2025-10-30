# 📊 Supabase 스키마 스냅샷

**생성일:** 2025-10-30
**목적:** RLS 정책 설계를 위한 실제 데이터베이스 구조 분석

---

## 1️⃣ 테이블 목록 및 RLS 상태

| schema | table_name           | rls_enabled | owner    |
|--------|---------------------|-------------|----------|
| public | beneficiaries       | false       | postgres |
| public | businesses          | false       | postgres |
| public | donation_matches    | false       | postgres |
| public | donations           | false       | postgres |
| public | notifications       | false       | postgres |
| public | pickup_schedules    | false       | postgres |
| public | profiles            | false       | postgres |
| public | quotes              | false       | postgres |
| public | reports             | false       | postgres |
| public | subscriber_donations| false       | postgres |

**⚠️ 중요:** 모든 테이블의 RLS가 **비활성화** 상태 → 보안 취약

---

## 2️⃣ 테이블별 컬럼 정보

### beneficiaries (수혜기관)
| column_name              | data_type                | is_nullable | column_default                | character_max_length |
|--------------------------|--------------------------|-------------|-------------------------------|---------------------|
| id                       | uuid                     | NO          | gen_random_uuid()             | null                |
| user_id                  | uuid                     | YES         | null                          | null                |
| organization_name        | character varying        | NO          | null                          | 255                 |
| organization_type        | character varying        | YES         | null                          | 100                 |
| representative_name      | character varying        | YES         | null                          | 255                 |
| phone                    | character varying        | YES         | null                          | 20                  |
| email                    | character varying        | YES         | null                          | 255                 |
| address                  | text                     | NO          | null                          | null                |
| detail_address           | text                     | YES         | null                          | null                |
| postcode                 | character varying        | YES         | null                          | 10                  |
| registration_number      | character varying        | YES         | null                          | 50                  |
| website                  | text                     | YES         | null                          | null                |
| sns_link                 | text                     | YES         | null                          | null                |
| tax_exempt_cert_url      | text                     | YES         | null                          | null                |
| desired_items            | ARRAY                    | YES         | null                          | null                |
| beneficiary_types        | ARRAY                    | YES         | null                          | null                |
| can_pickup               | boolean                  | YES         | false                         | null                |
| can_issue_receipt        | boolean                  | YES         | false                         | null                |
| additional_request       | text                     | YES         | null                          | null                |
| status                   | character varying        | YES         | 'pending'::character varying  | 50                  |
| contract_signed          | boolean                  | YES         | false                         | null                |
| approved_at              | timestamp with time zone | YES         | null                          | null                |
| created_at               | timestamp with time zone | YES         | now()                         | null                |
| updated_at               | timestamp with time zone | YES         | now()                         | null                |

### businesses (기업/기부자)
| column_name                  | data_type                | is_nullable | column_default                | character_max_length |
|------------------------------|--------------------------|-------------|-------------------------------|---------------------|
| id                           | uuid                     | NO          | uuid_generate_v4()            | null                |
| user_id                      | uuid                     | YES         | null                          | null                |
| name                         | text                     | NO          | null                          | null                |
| representative_name          | text                     | YES         | null                          | null                |
| phone                        | text                     | YES         | null                          | null                |
| email                        | text                     | YES         | null                          | null                |
| address                      | text                     | YES         | null                          | null                |
| detail_address               | text                     | YES         | null                          | null                |
| postcode                     | character varying        | YES         | null                          | 10                  |
| business_license_url         | text                     | NO          | null                          | null                |
| business_number              | text                     | YES         | null                          | null                |
| business_registration_number | character varying        | YES         | null                          | 50                  |
| business_type                | character varying        | YES         | null                          | 100                 |
| manager_name                 | text                     | YES         | null                          | null                |
| manager_phone                | text                     | YES         | null                          | null                |
| website                      | text                     | YES         | null                          | null                |
| sns_link                     | text                     | YES         | null                          | null                |
| status                       | USER-DEFINED             | YES         | 'pending'::business_status    | null                |
| contract_signed              | boolean                  | YES         | false                         | null                |
| contract_signed_at           | timestamp with time zone | YES         | null                          | null                |
| approved_at                  | timestamp with time zone | YES         | null                          | null                |
| approved_by                  | uuid                     | YES         | null                          | null                |
| esg_report_url               | text                     | YES         | null                          | null                |
| created_at                   | timestamp with time zone | YES         | now()                         | null                |
| updated_at                   | timestamp with time zone | YES         | now()                         | null                |

### donations (기부 목록)
| column_name               | data_type                | is_nullable | column_default                    | character_max_length |
|---------------------------|--------------------------|-------------|-----------------------------------|---------------------|
| id                        | uuid                     | NO          | uuid_generate_v4()                | null                |
| business_id               | uuid                     | NO          | null                              | null                |
| name                      | text                     | YES         | null                              | null                |
| description               | text                     | NO          | null                              | null                |
| category                  | text                     | YES         | null                              | null                |
| photos                    | ARRAY                    | YES         | '{}'::text[]                      | null                |
| quantity                  | integer                  | NO          | null                              | null                |
| unit                      | text                     | YES         | 'kg'::text                        | null                |
| condition                 | text                     | YES         | 'good'::text                      | null                |
| expiration_date           | date                     | YES         | null                              | null                |
| additional_info           | text                     | YES         | null                              | null                |
| pickup_location           | text                     | NO          | null                              | null                |
| pickup_deadline           | timestamp with time zone | NO          | null                              | null                |
| pickup_time               | character varying        | YES         | null                              | 100                 |
| direct_delivery_available | boolean                  | YES         | false                             | null                |
| product_detail_url        | text                     | YES         | null                              | null                |
| tax_deduction_needed      | boolean                  | YES         | false                             | null                |
| tax_invoice_email         | character varying        | YES         | null                              | 255                 |
| business_type             | character varying        | YES         | null                              | 100                 |
| status                    | USER-DEFINED             | YES         | 'pending_review'::donation_status | null                |
| matched_charity_name      | text                     | YES         | null                              | null                |
| matched_at                | timestamp with time zone | YES         | null                              | null                |
| matched_by                | uuid                     | YES         | null                              | null                |
| pickup_scheduled_at       | timestamp with time zone | YES         | null                              | null                |
| completed_at              | timestamp with time zone | YES         | null                              | null                |
| tax_document_url          | text                     | YES         | null                              | null                |
| esg_report_url            | text                     | YES         | null                              | null                |
| post_donation_media       | ARRAY                    | YES         | '{}'::text[]                      | null                |
| co2_saved                 | numeric                  | YES         | null                              | null                |
| meals_served              | integer                  | YES         | null                              | null                |
| waste_diverted            | numeric                  | YES         | null                              | null                |
| created_at                | timestamp with time zone | YES         | now()                             | null                |
| updated_at                | timestamp with time zone | YES         | now()                             | null                |

### donation_matches (기부-수혜기관 매칭)
| column_name        | data_type                | is_nullable | column_default                | character_max_length |
|--------------------|--------------------------|-------------|-------------------------------|---------------------|
| id                 | uuid                     | NO          | gen_random_uuid()             | null                |
| donation_id        | uuid                     | YES         | null                          | null                |
| beneficiary_id     | uuid                     | YES         | null                          | null                |
| proposed_by        | uuid                     | YES         | null                          | null                |
| status             | character varying        | YES         | 'proposed'::character varying | 50                  |
| accepted_quantity  | numeric                  | YES         | null                          | null                |
| accepted_unit      | character varying        | YES         | null                          | 50                  |
| proposed_at        | timestamp with time zone | YES         | now()                         | null                |
| quote_sent_at      | timestamp with time zone | YES         | null                          | null                |
| responded_at       | timestamp with time zone | YES         | null                          | null                |
| received_at        | timestamp with time zone | YES         | null                          | null                |
| response_notes     | text                     | YES         | null                          | null                |
| receipt_photos     | ARRAY                    | YES         | null                          | null                |
| receipt_issued     | boolean                  | YES         | false                         | null                |
| receipt_issued_at  | timestamp with time zone | YES         | null                          | null                |
| receipt_file_url   | text                     | YES         | null                          | null                |
| created_at         | timestamp with time zone | YES         | now()                         | null                |
| updated_at         | timestamp with time zone | YES         | now()                         | null                |

### quotes (견적서)
| column_name    | data_type                | is_nullable | column_default | character_max_length |
|----------------|--------------------------|-------------|----------------|---------------------|
| id             | uuid                     | NO          | (다음 쿼리 필요) | null                |
| donation_id    | uuid                     | NO          | null           | null                |
| amount         | numeric                  | NO          | null           | null                |
| payment_terms  | text                     | NO          | null           | null                |
| status         | USER-DEFINED             | YES         | 'sent'         | null                |
| sent_by        | uuid                     | YES         | null           | null                |
| accepted_at    | timestamp with time zone | YES         | null           | null                |
| rejected_at    | timestamp with time zone | YES         | null           | null                |
| created_at     | timestamp with time zone | YES         | now()          | null                |
| updated_at     | timestamp with time zone | YES         | now()          | null                |

### pickup_schedules (픽업 일정)
| column_name      | data_type                | is_nullable | column_default | character_max_length |
|------------------|--------------------------|-------------|----------------|---------------------|
| id               | uuid                     | NO          | (다음 쿼리 필요) | null                |
| donation_id      | uuid                     | NO          | null           | null                |
| scheduled_date   | timestamp with time zone | NO          | null           | null                |
| scheduled_time   | character varying        | YES         | null           | 100                 |
| contact_person   | text                     | YES         | null           | null                |
| contact_phone    | text                     | YES         | null           | null                |
| pickup_location  | text                     | NO          | null           | null                |
| additional_notes | text                     | YES         | null           | null                |
| status           | character varying        | YES         | 'scheduled'    | 50                  |
| created_at       | timestamp with time zone | YES         | now()          | null                |
| updated_at       | timestamp with time zone | YES         | now()          | null                |

### profiles (사용자 프로필)
| column_name | data_type                | is_nullable | column_default | character_max_length |
|-------------|--------------------------|-------------|----------------|---------------------|
| id          | uuid                     | NO          | (auth.users.id) | null                |
| email       | text                     | NO          | null           | null                |
| role        | USER-DEFINED             | NO          | null           | null                |
| created_at  | timestamp with time zone | YES         | now()          | null                |
| updated_at  | timestamp with time zone | YES         | now()          | null                |

### notifications (알림)
| column_name | data_type                | is_nullable | column_default | character_max_length |
|-------------|--------------------------|-------------|----------------|---------------------|
| id          | uuid                     | NO          | (다음 쿼리 필요) | null                |
| user_id     | uuid                     | NO          | null           | null                |
| title       | text                     | NO          | null           | null                |
| message     | text                     | NO          | null           | null                |
| type        | text                     | NO          | null           | null                |
| read        | boolean                  | YES         | false          | null                |
| read_at     | timestamp with time zone | YES         | null           | null                |
| metadata    | jsonb                    | YES         | null           | null                |
| created_at  | timestamp with time zone | YES         | now()          | null                |

### reports (ESG 리포트)
| column_name  | data_type                | is_nullable | column_default | character_max_length |
|--------------|--------------------------|-------------|----------------|---------------------|
| id           | uuid                     | NO          | (다음 쿼리 필요) | null                |
| business_id  | uuid                     | NO          | null           | null                |
| title        | text                     | NO          | null           | null                |
| description  | text                     | YES         | null           | null                |
| period_start | date                     | NO          | null           | null                |
| period_end   | date                     | NO          | null           | null                |
| file_url     | text                     | YES         | null           | null                |
| media_links  | ARRAY                    | YES         | null           | null                |
| created_by   | uuid                     | YES         | null           | null                |
| created_at   | timestamp with time zone | YES         | now()          | null                |
| updated_at   | timestamp with time zone | YES         | now()          | null                |

### subscriber_donations (구독 기부 - 코드에서 미사용)
| column_name      | data_type                | is_nullable | column_default | character_max_length |
|------------------|--------------------------|-------------|----------------|---------------------|
| id               | uuid                     | NO          | (다음 쿼리 필요) | null                |
| business_id      | uuid                     | NO          | null           | null                |
| description      | text                     | NO          | null           | null                |
| donation_date    | date                     | NO          | null           | null                |
| quantity         | numeric                  | YES         | null           | null                |
| charity_name     | text                     | YES         | null           | null                |
| esg_report_url   | text                     | YES         | null           | null                |
| supporting_media | ARRAY                    | YES         | null           | null                |
| co2_saved        | numeric                  | YES         | null           | null                |
| meals_served     | integer                  | YES         | null           | null                |
| waste_diverted   | numeric                  | YES         | null           | null                |
| created_by       | uuid                     | YES         | null           | null                |
| created_at       | timestamp with time zone | YES         | now()          | null                |
| updated_at       | timestamp with time zone | YES         | now()          | null                |

---

## 3️⃣ Foreign Key 관계

| table_name           | column_name    | foreign_table_name | foreign_column_name | constraint_name                       |
|----------------------|----------------|--------------------|---------------------|---------------------------------------|
| donation_matches     | beneficiary_id | beneficiaries      | id                  | donation_matches_beneficiary_id_fkey  |
| donation_matches     | donation_id    | donations          | id                  | donation_matches_donation_id_fkey     |
| donations            | business_id    | businesses         | id                  | donations_business_id_fkey            |
| pickup_schedules     | donation_id    | donations          | id                  | pickup_schedules_donation_id_fkey     |
| quotes               | donation_id    | donations          | id                  | quotes_donation_id_fkey               |
| reports              | business_id    | businesses         | id                  | reports_business_id_fkey              |
| subscriber_donations | business_id    | businesses         | id                  | subscriber_donations_business_id_fkey |

**🔥 핵심 관계:**
```
beneficiaries (수혜기관)
    ↓ (1:N)
donation_matches (매칭)
    ↓ (N:1)
donations (기부)
    ↓ (N:1)
businesses (기업)
```

**크로스 조인 경로 (Beneficiary → Business):**
```
beneficiaries
  → donation_matches (beneficiary_id)
    → donations (donation_id)
      → businesses (business_id)
```

---

## 4️⃣ Primary Key 정보

| table_name           | column_name | constraint_name           |
|----------------------|-------------|---------------------------|
| beneficiaries        | id          | beneficiaries_pkey        |
| businesses           | id          | businesses_pkey           |
| donation_matches     | id          | donation_matches_pkey     |
| donations            | id          | donations_pkey            |
| notifications        | id          | notifications_pkey        |
| pickup_schedules     | id          | pickup_schedules_pkey     |
| profiles             | id          | profiles_pkey             |
| quotes               | id          | quotes_pkey               |
| reports              | id          | reports_pkey              |
| subscriber_donations | id          | subscriber_donations_pkey |

---

## 5️⃣ 인덱스 정보

| table_name           | index_name                                      | index_definition                                                                                                                         |
|----------------------|-------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| beneficiaries        | beneficiaries_pkey                              | CREATE UNIQUE INDEX beneficiaries_pkey ON public.beneficiaries USING btree (id)                                                          |
| beneficiaries        | idx_beneficiaries_status                        | CREATE INDEX idx_beneficiaries_status ON public.beneficiaries USING btree (status)                                                       |
| beneficiaries        | idx_beneficiaries_user_id                       | CREATE INDEX idx_beneficiaries_user_id ON public.beneficiaries USING btree (user_id)                                                     |
| businesses           | businesses_pkey                                 | CREATE UNIQUE INDEX businesses_pkey ON public.businesses USING btree (id)                                                                |
| businesses           | idx_businesses_status                           | CREATE INDEX idx_businesses_status ON public.businesses USING btree (status)                                                             |
| businesses           | idx_businesses_user_id                          | CREATE INDEX idx_businesses_user_id ON public.businesses USING btree (user_id)                                                           |
| donation_matches     | donation_matches_donation_id_beneficiary_id_key | CREATE UNIQUE INDEX donation_matches_donation_id_beneficiary_id_key ON public.donation_matches USING btree (donation_id, beneficiary_id) |
| donation_matches     | donation_matches_pkey                           | CREATE UNIQUE INDEX donation_matches_pkey ON public.donation_matches USING btree (id)                                                    |
| donation_matches     | idx_donation_matches_beneficiary_id             | CREATE INDEX idx_donation_matches_beneficiary_id ON public.donation_matches USING btree (beneficiary_id)                                 |
| donation_matches     | idx_donation_matches_donation_id                | CREATE INDEX idx_donation_matches_donation_id ON public.donation_matches USING btree (donation_id)                                       |
| donation_matches     | idx_donation_matches_status                     | CREATE INDEX idx_donation_matches_status ON public.donation_matches USING btree (status)                                                 |
| donations            | donations_pkey                                  | CREATE UNIQUE INDEX donations_pkey ON public.donations USING btree (id)                                                                  |
| donations            | idx_donations_business_id                       | CREATE INDEX idx_donations_business_id ON public.donations USING btree (business_id)                                                     |
| donations            | idx_donations_status                            | CREATE INDEX idx_donations_status ON public.donations USING btree (status)                                                               |
| notifications        | idx_notifications_read                          | CREATE INDEX idx_notifications_read ON public.notifications USING btree (read)                                                           |
| notifications        | idx_notifications_user_id                       | CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)                                                     |
| notifications        | notifications_pkey                              | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)                                                          |
| pickup_schedules     | pickup_schedules_pkey                           | CREATE UNIQUE INDEX pickup_schedules_pkey ON public.pickup_schedules USING btree (id)                                                    |
| profiles             | profiles_pkey                                   | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)                                                                    |
| quotes               | quotes_pkey                                     | CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id)                                                                        |
| reports              | idx_reports_business_id                         | CREATE INDEX idx_reports_business_id ON public.reports USING btree (business_id)                                                         |
| reports              | idx_reports_created_at                          | CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at DESC)                                                      |
| reports              | reports_pkey                                    | CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id)                                                                      |
| subscriber_donations | idx_subscriber_donations_business_id            | CREATE INDEX idx_subscriber_donations_business_id ON public.subscriber_donations USING btree (business_id)                               |
| subscriber_donations | subscriber_donations_pkey                       | CREATE UNIQUE INDEX subscriber_donations_pkey ON public.subscriber_donations USING btree (id)                                            |

**✅ 좋은 소식:** RLS 성능에 필요한 주요 인덱스가 이미 존재!
- `user_id` 인덱스 (businesses, beneficiaries)
- `business_id` 인덱스 (donations, reports)
- `donation_id`, `beneficiary_id` 인덱스 (donation_matches)
- `status` 인덱스 (모든 주요 테이블)

---

## 6️⃣ 현재 RLS 정책

**결과:** 없음

**상태:** 모든 테이블이 RLS 비활성화 상태

---

## 7️⃣ Storage Buckets

| id                  | name                | public | file_size_limit | allowed_mime_types                                  |
|---------------------|---------------------|--------|-----------------|-----------------------------------------------------|
| business-licenses   | business-licenses   | true   | null            | null                                                |
| contract-signatures | contract-signatures | true   | null            | null                                                |
| donation-photos     | donation-photos     | true   | 5242880         | ["image/jpeg","image/png","image/gif","image/webp"] |
| donation-receipts   | donation-receipts   | true   | null            | null                                                |
| esg-reports         | esg-reports         | true   | null            | null                                                |
| post-donation-media | post-donation-media | true   | null            | null                                                |
| tax-documents       | tax-documents       | true   | null            | null                                                |

**⚠️ 심각한 보안 문제:**
- 모든 버킷이 `public = true`
- 파일 URL만 있으면 누구나 접근 가능
- Storage RLS 정책 필요!

**누락된 버킷:**
- `beneficiary-docs` (코드에서 사용되지만 버킷 없음)
- `donation-images` (코드에서 사용되지만 버킷 없음)

**추가 버킷:**
- `contract-signatures` (코드에서 미사용)
- `tax-documents` (코드에서 미사용)

---

## 8️⃣ Storage Bucket 정책

**결과:** 오류 발생 (storage.policies 테이블 없음?)

**상태:** Storage bucket에 RLS 정책 없음

---

## 9️⃣ 테이블별 레코드 수

**결과:** 오류 발생

---

## 🔟 Enum 타입 정의

| enum_name       | enum_value           |
|-----------------|----------------------|
| business_status | pending              |
| business_status | approved             |
| business_status | rejected             |
| donation_status | pending_review       |
| donation_status | quote_sent           |
| donation_status | quote_accepted       |
| donation_status | matched              |
| donation_status | beneficiary_accepted |
| donation_status | pickup_scheduled     |
| donation_status | completed            |
| donation_status | pickup_coordinating  |
| quote_status    | sent                 |
| quote_status    | accepted             |
| quote_status    | rejected             |
| user_role       | business             |
| user_role       | admin                |
| user_role       | beneficiary          |

**중요:** `donation_status`에 추가 상태 발견
- `beneficiary_accepted` (코드의 타입 정의에 없음)
- `pickup_coordinating` (코드의 타입 정의에 없음)

---

## 📊 분석 결과 요약

### ✅ 좋은 점
1. **인덱스 완비:** RLS 성능에 필요한 모든 인덱스 존재
2. **FK 관계 명확:** 데이터 무결성 보장
3. **Unique 제약:** donation_matches에 (donation_id, beneficiary_id) 조합 유니크

### ⚠️ 심각한 보안 문제
1. **RLS 전체 비활성화:** 모든 테이블 누구나 접근 가능
2. **Storage 공개:** 모든 버킷 public, 정책 없음
3. **서비스 현황:** 프로덕션 서비스가 완전 무방비 상태

### 🔧 주의사항
1. **Enum 불일치:** 코드 타입과 DB enum이 다름
   - DB: `beneficiary_accepted`, `pickup_coordinating`
   - 코드: 이 상태들 없음

2. **Storage 버킷 불일치:**
   - 코드에서 사용: `beneficiary-docs`, `donation-images`
   - DB에 없음: 이 버킷들 생성 필요

3. **subscriber_donations:**
   - 테이블 존재하지만 코드에서 미사용
   - RLS 정책 필요 여부 확인 필요

---

## 🎯 다음 단계

### 즉시 조치 필요 (Phase 1)
1. ✅ SERVICE_ROLE_KEY 클라이언트 제거
2. ✅ Beneficiary API 인증 추가

### RLS 적용 전 확인 사항
1. [ ] Enum 타입 불일치 해결
2. [ ] Storage 버킷 생성 (`beneficiary-docs`, `donation-images`)
3. [ ] `subscriber_donations` 사용 여부 확인

### RLS 적용 순서 (Phase 4)
1. **Day 1:** profiles, reports, notifications
2. **Day 2:** businesses, beneficiaries, donations
3. **Day 3:** donation_matches, quotes, pickup_schedules
4. **Day 3 후반:** Storage buckets

---

**스냅샷 생성일:** 2025-10-30
**다음 업데이트:** Phase 1 완료 후
