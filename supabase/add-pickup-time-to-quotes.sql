-- Add pickup_time field to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS pickup_time TEXT;