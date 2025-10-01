/*
  # Add Extended Lead Profile Fields

  1. New Columns
    - `company_info` - Detailed company information
    - `company_size` - Company size range (e.g., "50-100", "500+")
    - `website_url` - Company website URL
    - `hiring_needs` - Array of hiring needs (IT, Non-IT, Volume, Leadership)
    - `points_of_contact` - JSON array of contact persons
    - `lead_source` - Source of the lead (LinkedIn, Reference, etc.)

  2. Updates
    - Add validation constraints where appropriate
    - Update indexes for performance
*/

-- Add new columns to leads table
DO $$
BEGIN
  -- Add company_info column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'company_info'
  ) THEN
    ALTER TABLE leads ADD COLUMN company_info text;
  END IF;

  -- Add company_size column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE leads ADD COLUMN company_size text;
  END IF;

  -- Add website_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN website_url text;
  END IF;

  -- Add hiring_needs column (array of text)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'hiring_needs'
  ) THEN
    ALTER TABLE leads ADD COLUMN hiring_needs text[] DEFAULT '{}';
  END IF;

  -- Add points_of_contact column (JSON array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'points_of_contact'
  ) THEN
    ALTER TABLE leads ADD COLUMN points_of_contact jsonb DEFAULT '[]';
  END IF;

  -- Add lead_source column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_source text;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_company_size ON leads(company_size);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_hiring_needs ON leads USING GIN(hiring_needs);