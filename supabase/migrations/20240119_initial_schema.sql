-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('business', 'admin');
CREATE TYPE business_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE donation_status AS ENUM ('pending_review', 'quote_sent', 'quote_accepted', 'matched', 'pickup_scheduled', 'completed');
CREATE TYPE quote_status AS ENUM ('sent', 'accepted', 'rejected');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE businesses (
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
CREATE TABLE donations (
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
CREATE TABLE quotes (
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
CREATE TABLE notifications (
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
CREATE TABLE subscriber_donations (
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

-- Create indexes
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_donations_business_id ON donations(business_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_quotes_donation_id ON quotes(donation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_subscriber_donations_business_id ON subscriber_donations(business_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'business');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();