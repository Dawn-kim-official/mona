-- =====================================================
-- MONA B2B Platform - Complete Supabase Setup
-- =====================================================

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE ENUM TYPES
-- =====================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('business', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE business_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('pending_review', 'quote_sent', 'quote_accepted', 'matched', 'pickup_scheduled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('sent', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'business',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    business_license_url TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    website TEXT,
    status business_status DEFAULT 'pending',
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_signed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    expiration_date DATE,
    quantity INTEGER NOT NULL,
    pickup_deadline TIMESTAMPTZ NOT NULL,
    pickup_location TEXT NOT NULL,
    tax_deduction_needed BOOLEAN DEFAULT FALSE,
    status donation_status DEFAULT 'pending_review',
    matched_charity_name TEXT,
    matched_at TIMESTAMPTZ,
    matched_by UUID REFERENCES auth.users(id),
    pickup_scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    tax_document_url TEXT,
    esg_report_url TEXT,
    post_donation_media TEXT[] DEFAULT '{}',
    co2_saved DECIMAL(10,2),
    meals_served INTEGER,
    waste_diverted DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_terms TEXT NOT NULL,
    status quote_status DEFAULT 'sent',
    sent_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriber_donations table (for offline donations)
CREATE TABLE IF NOT EXISTS subscriber_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    donation_date DATE NOT NULL,
    quantity INTEGER,
    charity_name TEXT,
    esg_report_url TEXT,
    supporting_media TEXT[] DEFAULT '{}',
    co2_saved DECIMAL(10,2),
    meals_served INTEGER,
    waste_diverted DECIMAL(10,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_business_id ON donations(business_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_quotes_donation_id ON quotes(donation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_subscriber_donations_business_id ON subscriber_donations(business_id);

-- =====================================================
-- 5. CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'business');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
DROP TRIGGER IF EXISTS update_subscriber_donations_updated_at ON subscriber_donations;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_donations_updated_at BEFORE UPDATE ON subscriber_donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Business owners can view own business" ON businesses;
DROP POLICY IF EXISTS "Admins can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can create business" ON businesses;
DROP POLICY IF EXISTS "Business owners can update own business" ON businesses;
DROP POLICY IF EXISTS "Admins can update any business" ON businesses;
DROP POLICY IF EXISTS "Business can view own donations" ON donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON donations;
DROP POLICY IF EXISTS "Business can create donations" ON donations;
DROP POLICY IF EXISTS "Business can update own donations" ON donations;
DROP POLICY IF EXISTS "Admins can update any donation" ON donations;
DROP POLICY IF EXISTS "Business can view quotes for own donations" ON quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can create quotes" ON quotes;
DROP POLICY IF EXISTS "Business can update quote status" ON quotes;
DROP POLICY IF EXISTS "Admins can update any quote" ON quotes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Business can view own subscriber donations" ON subscriber_donations;
DROP POLICY IF EXISTS "Admins can view all subscriber donations" ON subscriber_donations;
DROP POLICY IF EXISTS "Admins can create subscriber donations" ON subscriber_donations;
DROP POLICY IF EXISTS "Admins can update subscriber donations" ON subscriber_donations;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Business owners can view own business" ON businesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all businesses" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Business owners can create business" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can update own business" ON businesses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any business" ON businesses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Donations policies
CREATE POLICY "Business can view own donations" ON donations
    FOR SELECT USING (
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

CREATE POLICY "Business can create donations" ON donations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = donations.business_id
            AND businesses.user_id = auth.uid()
            AND businesses.status = 'approved'
            AND businesses.contract_signed = true
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

CREATE POLICY "Admins can update any donation" ON donations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Quotes policies
CREATE POLICY "Business can view quotes for own donations" ON quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM donations
            JOIN businesses ON businesses.id = donations.business_id
            WHERE donations.id = quotes.donation_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all quotes" ON quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create quotes" ON quotes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Business can update quote status" ON quotes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM donations
            JOIN businesses ON businesses.id = donations.business_id
            WHERE donations.id = quotes.donation_id
            AND businesses.user_id = auth.uid()
        )
    ) WITH CHECK (
        status IN ('accepted', 'rejected')
    );

CREATE POLICY "Admins can update any quote" ON quotes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Subscriber donations policies
CREATE POLICY "Business can view own subscriber donations" ON subscriber_donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = subscriber_donations.business_id
            AND businesses.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all subscriber donations" ON subscriber_donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create subscriber donations" ON subscriber_donations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update subscriber donations" ON subscriber_donations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 9. CREATE STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('business-licenses', 'business-licenses', false),
    ('donation-photos', 'donation-photos', true),
    ('tax-documents', 'tax-documents', false),
    ('esg-reports', 'esg-reports', false),
    ('post-donation-media', 'post-donation-media', true),
    ('contract-signatures', 'contract-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. CREATE STORAGE POLICIES
-- =====================================================

-- Drop existing storage policies if they exist
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
DROP POLICY IF EXISTS "Business can upload contract signatures" ON storage.objects;
DROP POLICY IF EXISTS "Business can view own contract signatures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all contract signatures" ON storage.objects;

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

-- Storage policies for contract-signatures bucket
CREATE POLICY "Business can upload contract signatures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contract-signatures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Business can view own contract signatures" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contract-signatures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all contract signatures" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contract-signatures' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 11. CREATE ADMIN USER (예시 - 실제 이메일로 변경 필요)
-- =====================================================
-- 먼저 Supabase Dashboard에서 관리자 계정을 생성한 후,
-- 아래 쿼리에서 이메일을 해당 이메일로 변경하여 실행하세요:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'admin@monaimpact.com';

-- =====================================================
-- 12. 소셜 로그인 설정 안내
-- =====================================================
-- 소셜 로그인은 Supabase Dashboard에서 설정해야 합니다:
-- 
-- 1. Google OAuth 설정:
--    - Dashboard > Authentication > Providers > Google 활성화
--    - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
--    - 리디렉션 URI: https://[프로젝트ID].supabase.co/auth/v1/callback
--    - Client ID와 Client Secret을 Supabase에 입력
--
-- 2. Kakao OAuth 설정:
--    - Dashboard > Authentication > Providers에서 Custom Provider 추가
--    - Provider Name: kakao
--    - Client ID: Kakao 앱 키
--    - Client Secret: Kakao 시크릿 키
--    - Authorization URL: https://kauth.kakao.com/oauth/authorize
--    - Token URL: https://kauth.kakao.com/oauth/token
--    - User Info URL: https://kapi.kakao.com/v2/user/me
--    - Scope: profile_nickname profile_image account_email
--
-- 3. 리디렉션 URL 설정:
--    - Site URL: http://localhost:3000 (개발)
--    - Additional Redirect URLs에 프로덕션 URL 추가