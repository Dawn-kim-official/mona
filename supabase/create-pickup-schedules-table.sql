-- Create pickup_schedules table
CREATE TABLE IF NOT EXISTS pickup_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_staff TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_donation_id ON pickup_schedules(donation_id);

-- Enable RLS
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;

-- Policy for businesses to view their own pickup schedules
CREATE POLICY "Businesses can view their own pickup schedules" ON pickup_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM donations d
    JOIN businesses b ON d.business_id = b.id
    WHERE d.id = pickup_schedules.donation_id
    AND b.user_id = auth.uid()
  )
);

-- Policy for admins to manage all pickup schedules
CREATE POLICY "Admins can manage all pickup schedules" ON pickup_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);