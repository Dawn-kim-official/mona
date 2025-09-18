-- Add accepted_quantity field to donation_matches table
ALTER TABLE donation_matches 
ADD COLUMN IF NOT EXISTS accepted_quantity NUMERIC,
ADD COLUMN IF NOT EXISTS accepted_unit VARCHAR(50);

-- Add remaining_quantity field to donations table to track what's left
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS remaining_quantity NUMERIC;

-- Initialize remaining_quantity with the original quantity for existing records
UPDATE donations 
SET remaining_quantity = quantity 
WHERE remaining_quantity IS NULL;

-- Create a function to calculate remaining quantity for a donation
CREATE OR REPLACE FUNCTION calculate_remaining_quantity(donation_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_quantity NUMERIC;
    total_accepted NUMERIC;
    remaining NUMERIC;
BEGIN
    -- Get the original donation quantity
    SELECT quantity INTO total_quantity
    FROM donations
    WHERE id = donation_id_param;
    
    -- Get the sum of accepted quantities from all accepted matches
    SELECT COALESCE(SUM(accepted_quantity), 0) INTO total_accepted
    FROM donation_matches
    WHERE donation_id = donation_id_param
    AND status IN ('accepted', 'received', 'quote_sent')
    AND accepted_quantity IS NOT NULL;
    
    -- Calculate remaining
    remaining := total_quantity - total_accepted;
    
    RETURN remaining;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update remaining_quantity when a match is accepted
CREATE OR REPLACE FUNCTION update_remaining_quantity_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('accepted', 'received', 'quote_sent') AND NEW.accepted_quantity IS NOT NULL THEN
        UPDATE donations
        SET remaining_quantity = calculate_remaining_quantity(NEW.donation_id)
        WHERE id = NEW.donation_id;
    END IF;
    
    -- If status changes from accepted to rejected, recalculate
    IF OLD.status IN ('accepted', 'received', 'quote_sent') AND NEW.status = 'rejected' THEN
        UPDATE donations
        SET remaining_quantity = calculate_remaining_quantity(NEW.donation_id)
        WHERE id = NEW.donation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_remaining_quantity_on_match ON donation_matches;

-- Create the trigger
CREATE TRIGGER update_remaining_quantity_on_match
AFTER INSERT OR UPDATE ON donation_matches
FOR EACH ROW
EXECUTE FUNCTION update_remaining_quantity_trigger();