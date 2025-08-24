-- 프로덕션용 RLS 활성화 스크립트
-- 배포 전에 실행하세요!

-- 1. RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations ENABLE ROW LEVEL SECURITY;

-- 2. profiles 테이블 정책
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. businesses 테이블 정책
CREATE POLICY "Users can view own business" ON businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business" ON businesses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all businesses" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Public can insert business during registration" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. donations 테이블 정책
CREATE POLICY "Business can view own donations" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = donations.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Business can create donations" ON donations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = donations.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Business can update own donations" ON donations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = donations.business_id 
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all donations" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. quotes 테이블 정책
CREATE POLICY "Business can view quotes for their donations" ON quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM donations d
            JOIN businesses b ON d.business_id = b.id
            WHERE d.id = quotes.donation_id 
            AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all quotes" ON quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. notifications 테이블 정책
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- 시스템에서만 생성

-- 7. Storage 정책
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('business_licenses', 'donation_photos', 'quote_documents', 'contracts', 'tax_receipts', 'esg_reports');

-- Storage 정책 추가 (예시)
CREATE POLICY "Users can upload own business license" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'business_licenses' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own business license" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'business_licenses' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );