-- Add company_logo_url column to speakers table
-- This column stores the extracted company logo URL from the company website

ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

COMMENT ON COLUMN speakers.company_logo_url IS 'Company logo URL extracted from company website using Firecrawl';
