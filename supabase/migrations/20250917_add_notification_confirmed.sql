-- Add notification_confirmed_at to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS notification_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add notification_confirmed_at to donation_matches table  
ALTER TABLE public.donation_matches
ADD COLUMN IF NOT EXISTS notification_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_donations_notification_confirmed 
ON public.donations(notification_confirmed_at);

CREATE INDEX IF NOT EXISTS idx_donation_matches_notification_confirmed
ON public.donation_matches(notification_confirmed_at);