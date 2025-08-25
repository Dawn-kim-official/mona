-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  unit_price INTEGER NOT NULL,
  logistics_cost INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  estimated_pickup_date DATE NOT NULL,
  pickup_time TEXT,
  special_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quotes_donation_id ON quotes(donation_id);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy for businesses to view their own quotes
CREATE POLICY "Businesses can view their own quotes" ON quotes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE d.id = quotes.donation_id
    AND b.user_id = auth.uid()
  )
);

-- Policy for admins to manage all quotes
CREATE POLICY "Admins can manage all quotes" ON quotes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);