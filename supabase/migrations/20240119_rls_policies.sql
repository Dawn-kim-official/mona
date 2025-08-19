-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_donations ENABLE ROW LEVEL SECURITY;

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
        -- Business can only accept or reject quotes
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