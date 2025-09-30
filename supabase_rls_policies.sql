-- MONA 플랫폼 RLS (Row Level Security) 정책 설정
-- 실행 전 Supabase 대시보드에서 각 테이블의 RLS를 활성화해야 함

-- ================================================
-- 1. profiles 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "프로필 조회 정책" ON profiles;
DROP POLICY IF EXISTS "프로필 수정 정책" ON profiles;
DROP POLICY IF EXISTS "프로필 생성 정책" ON profiles;

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "프로필 조회 정책" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "프로필 수정 정책" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "프로필 생성 정책" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ================================================
-- 2. businesses 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "기업 조회 정책" ON businesses;
DROP POLICY IF EXISTS "기업 생성 정책" ON businesses;
DROP POLICY IF EXISTS "기업 수정 정책" ON businesses;
DROP POLICY IF EXISTS "어드민 기업 관리 정책" ON businesses;

-- RLS 활성화
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 승인된 기업 정보 조회 가능
CREATE POLICY "기업 조회 정책" ON businesses
    FOR SELECT
    USING (
        status = 'approved' 
        OR auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 인증된 사용자는 기업 생성 가능
CREATE POLICY "기업 생성 정책" ON businesses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 기업은 자신의 정보만 수정 가능
CREATE POLICY "기업 수정 정책" ON businesses
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 어드민은 모든 기업 관리 가능
CREATE POLICY "어드민 기업 관리 정책" ON businesses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 3. beneficiaries 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "수혜기관 조회 정책" ON beneficiaries;
DROP POLICY IF EXISTS "수혜기관 생성 정책" ON beneficiaries;
DROP POLICY IF EXISTS "수혜기관 수정 정책" ON beneficiaries;
DROP POLICY IF EXISTS "어드민 수혜기관 관리 정책" ON beneficiaries;

-- RLS 활성화
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 수혜기관 조회 가능
CREATE POLICY "수혜기관 조회 정책" ON beneficiaries
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
    );

-- 인증된 사용자는 수혜기관 생성 가능
CREATE POLICY "수혜기관 생성 정책" ON beneficiaries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 수혜기관은 자신의 정보만 수정 가능
CREATE POLICY "수혜기관 수정 정책" ON beneficiaries
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 어드민은 모든 수혜기관 관리 가능
CREATE POLICY "어드민 수혜기관 관리 정책" ON beneficiaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 4. donations 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "기부 조회 정책" ON donations;
DROP POLICY IF EXISTS "기부 생성 정책" ON donations;
DROP POLICY IF EXISTS "기부 수정 정책" ON donations;
DROP POLICY IF EXISTS "어드민 기부 관리 정책" ON donations;

-- RLS 활성화
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- 기부 조회: 승인된 기업의 기부 또는 자신의 기부만 조회 가능
CREATE POLICY "기부 조회 정책" ON donations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = donations.business_id 
            AND (
                businesses.status = 'approved'
                OR businesses.user_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM beneficiaries 
            WHERE beneficiaries.user_id = auth.uid()
        )
    );

-- 기업만 기부 생성 가능
CREATE POLICY "기부 생성 정책" ON donations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- 기업은 자신의 기부만 수정 가능
CREATE POLICY "기부 수정 정책" ON donations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = donations.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- 어드민은 모든 기부 관리 가능
CREATE POLICY "어드민 기부 관리 정책" ON donations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 5. donation_matches 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "매칭 조회 정책" ON donation_matches;
DROP POLICY IF EXISTS "매칭 생성 정책" ON donation_matches;
DROP POLICY IF EXISTS "매칭 수정 정책" ON donation_matches;
DROP POLICY IF EXISTS "어드민 매칭 관리 정책" ON donation_matches;

-- RLS 활성화
ALTER TABLE donation_matches ENABLE ROW LEVEL SECURITY;

-- 관련 기업/수혜기관/어드민만 매칭 조회 가능
CREATE POLICY "매칭 조회 정책" ON donation_matches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM donations d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = donation_matches.donation_id
            AND b.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM beneficiaries
            WHERE beneficiaries.id = donation_matches.beneficiary_id
            AND beneficiaries.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 수혜기관만 매칭 생성(제안) 가능
CREATE POLICY "매칭 생성 정책" ON donation_matches
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM beneficiaries
            WHERE beneficiaries.id = beneficiary_id
            AND beneficiaries.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 관련 수혜기관만 매칭 수정 가능
CREATE POLICY "매칭 수정 정책" ON donation_matches
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM beneficiaries
            WHERE beneficiaries.id = donation_matches.beneficiary_id
            AND beneficiaries.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민은 모든 매칭 관리 가능
CREATE POLICY "어드민 매칭 관리 정책" ON donation_matches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 6. quotes 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "견적서 조회 정책" ON quotes;
DROP POLICY IF EXISTS "견적서 생성 정책" ON quotes;
DROP POLICY IF EXISTS "견적서 수정 정책" ON quotes;
DROP POLICY IF EXISTS "어드민 견적서 관리 정책" ON quotes;

-- RLS 활성화
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 관련 기업/수혜기관/어드민만 견적서 조회 가능
CREATE POLICY "견적서 조회 정책" ON quotes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM donations d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = quotes.donation_id
            AND b.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM donation_matches dm
            JOIN donations d ON dm.donation_id = d.id
            JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
            WHERE d.id = quotes.donation_id
            AND ben.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민만 견적서 생성 가능
CREATE POLICY "견적서 생성 정책" ON quotes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민만 견적서 수정 가능
CREATE POLICY "견적서 수정 정책" ON quotes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민은 모든 견적서 관리 가능
CREATE POLICY "어드민 견적서 관리 정책" ON quotes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 7. reports 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "리포트 조회 정책" ON reports;
DROP POLICY IF EXISTS "리포트 생성 정책" ON reports;
DROP POLICY IF EXISTS "리포트 수정 정책" ON reports;
DROP POLICY IF EXISTS "어드민 리포트 관리 정책" ON reports;

-- RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 기업은 자신의 리포트, 어드민은 모든 리포트 조회 가능
CREATE POLICY "리포트 조회 정책" ON reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = reports.business_id 
            AND businesses.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민만 리포트 생성 가능
CREATE POLICY "리포트 생성 정책" ON reports
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민만 리포트 수정 가능
CREATE POLICY "리포트 수정 정책" ON reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민은 모든 리포트 관리 가능
CREATE POLICY "어드민 리포트 관리 정책" ON reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 8. notifications 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "알림 조회 정책" ON notifications;
DROP POLICY IF EXISTS "알림 생성 정책" ON notifications;
DROP POLICY IF EXISTS "알림 수정 정책" ON notifications;

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "알림 조회 정책" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- 시스템/어드민만 알림 생성 가능
CREATE POLICY "알림 생성 정책" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 사용자는 자신의 알림만 수정(읽음 처리 등) 가능
CREATE POLICY "알림 수정 정책" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ================================================
-- 9. pickup_schedules 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "픽업일정 조회 정책" ON pickup_schedules;
DROP POLICY IF EXISTS "픽업일정 생성 정책" ON pickup_schedules;
DROP POLICY IF EXISTS "픽업일정 수정 정책" ON pickup_schedules;

-- RLS 활성화
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;

-- 관련 당사자와 어드민만 조회 가능
CREATE POLICY "픽업일정 조회 정책" ON pickup_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM donations d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = pickup_schedules.donation_id
            AND b.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM donation_matches dm
            JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
            WHERE dm.donation_id = pickup_schedules.donation_id
            AND ben.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민과 수혜기관만 생성 가능
CREATE POLICY "픽업일정 생성 정책" ON pickup_schedules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM donation_matches dm
            JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
            WHERE dm.donation_id = donation_id
            AND ben.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 어드민과 관련 수혜기관만 수정 가능
CREATE POLICY "픽업일정 수정 정책" ON pickup_schedules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM donation_matches dm
            JOIN beneficiaries ben ON dm.beneficiary_id = ben.id
            WHERE dm.donation_id = pickup_schedules.donation_id
            AND ben.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ================================================
-- 10. subscriber_donations 테이블 RLS 정책
-- ================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "구독기부 조회 정책" ON subscriber_donations;
DROP POLICY IF EXISTS "구독기부 생성 정책" ON subscriber_donations;
DROP POLICY IF EXISTS "구독기부 수정 정책" ON subscriber_donations;

-- RLS 활성화
ALTER TABLE subscriber_donations ENABLE ROW LEVEL SECURITY;

-- 관련 기업과 어드민만 조회 가능
CREATE POLICY "구독기부 조회 정책" ON subscriber_donations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = subscriber_donations.business_id 
            AND businesses.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 기업만 생성 가능
CREATE POLICY "구독기부 생성 정책" ON subscriber_donations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- 기업만 자신의 구독기부 수정 가능
CREATE POLICY "구독기부 수정 정책" ON subscriber_donations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = subscriber_donations.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

-- ================================================
-- 실행 안내
-- ================================================

-- 1. Supabase 대시보드 > SQL Editor에서 실행
-- 2. 각 테이블별로 순서대로 실행 권장
-- 3. 실행 후 대시보드 > Authentication > Policies에서 확인 가능
-- 4. 테스트 환경에서 먼저 테스트 후 프로덕션 적용 권장

-- 주의사항:
-- - RLS 활성화 후 정책이 없으면 모든 접근이 차단됨
-- - service_role_key는 RLS를 우회하므로 서버에서만 사용
-- - anon_key는 RLS 정책을 따르므로 클라이언트에서 안전하게 사용 가능
-- - receipts 테이블은 별도로 존재하지 않고 donation_matches 테이블에 통합되어 있음