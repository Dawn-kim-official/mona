-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('business-licenses', 'business-licenses', false),
    ('donation-photos', 'donation-photos', true),
    ('tax-documents', 'tax-documents', false),
    ('esg-reports', 'esg-reports', false),
    ('post-donation-media', 'post-donation-media', true);

-- Storage policies for business-licenses bucket
CREATE POLICY "Business owners can upload own license" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'business-licenses' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Business owners can view own license" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'business-licenses' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all licenses" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'business-licenses' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Storage policies for donation-photos bucket (public bucket)
CREATE POLICY "Business can upload donation photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'donation-photos' AND
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.user_id = auth.uid()
            AND businesses.status = 'approved'
        )
    );

CREATE POLICY "Anyone can view donation photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'donation-photos');

CREATE POLICY "Business can update own donation photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'donation-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Business can delete own donation photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'donation-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for tax-documents bucket
CREATE POLICY "Admins can upload tax documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'tax-documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Business can view own tax documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'tax-documents' AND
        EXISTS (
            SELECT 1 FROM donations
            JOIN businesses ON businesses.id = donations.business_id
            WHERE businesses.user_id = auth.uid()
            AND donations.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Admins can view all tax documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'tax-documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Storage policies for esg-reports bucket
CREATE POLICY "Admins can upload ESG reports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'esg-reports' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Business can view own ESG reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'esg-reports' AND
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.user_id = auth.uid()
            AND businesses.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Admins can view all ESG reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'esg-reports' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Storage policies for post-donation-media bucket (public bucket)
CREATE POLICY "Admins can upload post donation media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-donation-media' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Anyone can view post donation media" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-donation-media');