-- Add missing fields to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'good',
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update name field with description for existing records
UPDATE donations 
SET name = COALESCE(name, LEFT(description, 50))
WHERE name IS NULL;