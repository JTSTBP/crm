/*
  # Comprehensive Lead Profile Enhancements

  1. New Tables
    - `lead_allocations` - Track daily quotas and assignments
    - `proposal_templates` - Store reusable proposal templates
    - `proposals` - Enhanced proposal tracking with templates
    - `activity_logs` - Enhanced activity logging

  2. Updates to Existing Tables
    - Add new fields to leads table
    - Update stage enum to include "Onboarded"
    - Add allocation and locking fields

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Add new fields to leads table if they don't exist
DO $$
BEGIN
  -- Add locked field for lead allocation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'locked'
  ) THEN
    ALTER TABLE leads ADD COLUMN locked boolean DEFAULT false;
  END IF;

  -- Add locked_by field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE leads ADD COLUMN locked_by uuid REFERENCES profiles(id);
  END IF;

  -- Add locked_at field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN locked_at timestamptz;
  END IF;

  -- Add potential_value field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'potential_value'
  ) THEN
    ALTER TABLE leads ADD COLUMN potential_value numeric;
  END IF;
END $$;

-- Update stage enum to include "Onboarded"
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
  
  -- Add the new constraint with "Onboarded"
  ALTER TABLE leads ADD CONSTRAINT leads_stage_check 
    CHECK (stage IN ('New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Onboarded'));
END $$;

-- Create lead_allocations table
CREATE TABLE IF NOT EXISTS lead_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  quota_limit integer NOT NULL DEFAULT 50,
  assigned_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create proposal_templates table
CREATE TABLE IF NOT EXISTS proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  placeholders jsonb DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES profiles(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update proposals table with template support
DO $$
BEGIN
  -- Add template_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN template_id uuid REFERENCES proposal_templates(id);
  END IF;

  -- Add email_sent field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE proposals ADD COLUMN email_sent boolean DEFAULT false;
  END IF;

  -- Add whatsapp_sent field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'whatsapp_sent'
  ) THEN
    ALTER TABLE proposals ADD COLUMN whatsapp_sent boolean DEFAULT false;
  END IF;

  -- Add content field for generated proposal content
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'content'
  ) THEN
    ALTER TABLE proposals ADD COLUMN content text;
  END IF;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE lead_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_allocations
CREATE POLICY "Users can read their own allocations"
  ON lead_allocations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "System can manage allocations"
  ON lead_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Create policies for proposal_templates
CREATE POLICY "All authenticated users can read active templates"
  ON proposal_templates FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admin and Manager can manage templates"
  ON proposal_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_allocations_user_date ON lead_allocations(user_id, date);
CREATE INDEX IF NOT EXISTS idx_leads_locked ON leads(locked, locked_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_stage ON leads(assigned_to, stage);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_active ON proposal_templates(active);
CREATE INDEX IF NOT EXISTS idx_proposals_template_id ON proposals(template_id);

-- Function to check and update daily allocation
CREATE OR REPLACE FUNCTION check_daily_allocation(user_uuid uuid, allocation_date date DEFAULT CURRENT_DATE)
RETURNS boolean AS $$
DECLARE
  current_allocation record;
  quota_limit integer := 50;
BEGIN
  -- Get or create allocation record for the user and date
  SELECT * INTO current_allocation
  FROM lead_allocations
  WHERE user_id = user_uuid AND date = allocation_date;
  
  IF NOT FOUND THEN
    -- Create new allocation record
    INSERT INTO lead_allocations (user_id, date, quota_limit, assigned_count)
    VALUES (user_uuid, allocation_date, quota_limit, 0);
    RETURN true;
  END IF;
  
  -- Check if user has reached quota
  RETURN current_allocation.assigned_count < current_allocation.quota_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment allocation count
CREATE OR REPLACE FUNCTION increment_allocation_count(user_uuid uuid, allocation_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO lead_allocations (user_id, date, quota_limit, assigned_count)
  VALUES (user_uuid, allocation_date, 50, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    assigned_count = lead_allocations.assigned_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER lead_allocations_updated_at
  BEFORE UPDATE ON lead_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default proposal templates
INSERT INTO proposal_templates (name, subject, content, placeholders, created_by, active) VALUES
('Standard IT Position', 
 'Proposal for {{position_type}} - {{client_name}}',
 'Dear {{client_name}},

Thank you for your interest in our recruitment services. We are pleased to present our proposal for the {{position_type}} position.

**Position Details:**
- Position: {{position_type}}
- Experience Level: {{experience_level}}
- Location: {{location}}
- Turn Around Time: {{tat}} days

**Commercial Terms:**
- Service Fee: {{service_fee}}
- Payment Terms: {{payment_terms}}
- Replacement Guarantee: {{replacement_guarantee}}

We look forward to partnering with you for your hiring needs.

Best regards,
{{consultant_name}}
Jobs Territory Team',
 '["client_name", "position_type", "experience_level", "location", "tat", "service_fee", "payment_terms", "replacement_guarantee", "consultant_name"]'::jsonb,
 (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1),
 true),

('Leadership Position',
 'Executive Search Proposal - {{position_type}} for {{client_name}}',
 'Dear {{client_name}},

We are excited to present our executive search proposal for the {{position_type}} position at your organization.

**Executive Search Details:**
- Position: {{position_type}}
- Reporting Level: {{reporting_level}}
- Industry Focus: {{industry_focus}}
- Search Timeline: {{search_timeline}} weeks

**Our Approach:**
- Comprehensive market mapping
- Targeted headhunting approach
- Thorough candidate assessment
- Reference verification

**Investment:**
- Search Fee: {{search_fee}}
- Payment Schedule: {{payment_schedule}}
- Success Guarantee: {{success_guarantee}}

We are committed to finding the right leadership talent for your organization.

Warm regards,
{{consultant_name}}
Jobs Territory Executive Search Team',
 '["client_name", "position_type", "reporting_level", "industry_focus", "search_timeline", "search_fee", "payment_schedule", "success_guarantee", "consultant_name"]'::jsonb,
 (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1),
 true)
ON CONFLICT DO NOTHING;