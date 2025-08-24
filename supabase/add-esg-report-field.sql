-- Add ESG report URL field to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS esg_report_url TEXT;

-- Comment for clarity
COMMENT ON COLUMN businesses.esg_report_url IS 'URL to the business ESG report PDF file';