/*
  # Create CRM Database Schema

  1. New Tables
    - `profiles` - User profiles with roles (Admin, Manager, BD Executive)
    - `leads` - Lead/prospect information with sales stages
    - `remarks` - Timeline of remarks (text, voice, file) for each lead
    - `proposals` - Proposal tracking with templates and status
    - `rate_cards` - Rate card versions with pricing items
    - `tasks` - Task management with due dates
    - `activity_logs` - System activity logging

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - BD Executives see only their assigned leads
    - Managers see their team's data
    - Admins see everything

  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for dashboard queries and filters
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'BD Executive')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to uuid NOT NULL REFERENCES profiles(id),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  stage text NOT NULL DEFAULT 'New' CHECK (stage IN ('New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')),
  value numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create remarks table
CREATE TABLE IF NOT EXISTS remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'file')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  template_used text NOT NULL,
  rate_card_version text NOT NULL,
  pdf_link text,
  sent_via text NOT NULL DEFAULT 'Email' CHECK (sent_via IN ('Email', 'WhatsApp', 'Both')),
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create rate_cards table
CREATE TABLE IF NOT EXISTS rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  items jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for leads
CREATE POLICY "BD Executives see assigned leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update accessible leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Create policies for remarks
CREATE POLICY "Users can read remarks for accessible leads"
  ON remarks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = remarks.lead_id AND (
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create remarks"
  ON remarks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = lead_id AND (
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
        )
      )
    )
  );

-- Create policies for proposals
CREATE POLICY "Users can read proposals for accessible leads"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = proposals.lead_id AND (
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM leads
      WHERE id = lead_id AND (
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
        )
      )
    )
  );

-- Create policies for rate_cards
CREATE POLICY "All authenticated users can read active rate cards"
  ON rate_cards FOR SELECT
  TO authenticated
  USING (active = true OR created_by = auth.uid());

CREATE POLICY "Admin and Manager can manage rate cards"
  ON rate_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Create policies for tasks
CREATE POLICY "Users can read their own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Create policies for activity_logs
CREATE POLICY "Users can read activity logs for accessible data"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (lead_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM leads
      WHERE id = activity_logs.lead_id AND (
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
        )
      )
    )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Authenticated users can create activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_remarks_lead_id ON remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_remarks_created_at ON remarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();