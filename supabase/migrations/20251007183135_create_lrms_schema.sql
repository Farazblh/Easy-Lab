/*
  # Lab Record Management System Database Schema

  ## Overview
  This migration creates the complete database schema for the Lab Record Management System (LRMS),
  including tables for users, clients, samples, and test results with proper relationships and security.

  ## Tables Created

  ### 1. profiles
  Extends Supabase auth.users with additional user information:
  - id (uuid, references auth.users)
  - full_name (text)
  - role (text) - 'admin', 'analyst', or 'viewer'
  - phone (text, optional)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. clients
  Stores laboratory client information:
  - id (uuid, primary key)
  - name (text) - Client name
  - company (text) - Company name
  - email (text) - Contact email
  - phone (text) - Contact phone
  - address (text, optional)
  - created_by (uuid) - References profiles
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 3. samples
  Stores sample information:
  - id (uuid, primary key)
  - sample_code (text, unique) - Auto-generated sample identifier
  - sample_type (text) - Type: Water, Meat, Swab, Air, etc.
  - source (text) - Source/Area description
  - collection_date (date) - When sample was collected
  - received_date (date) - When lab received sample
  - client_id (uuid) - References clients
  - analyst_id (uuid) - References profiles (assigned analyst)
  - status (text) - 'pending' or 'completed'
  - created_by (uuid) - References profiles
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 4. test_results
  Stores test results for each sample:
  - id (uuid, primary key)
  - sample_id (uuid) - References samples
  - tpc (numeric, optional) - Total Plate Count (CFU/ml)
  - coliforms (text, optional) - 'positive' or 'negative'
  - ecoli_o157 (text, optional) - E. coli O157 test result
  - salmonella (text, optional) - Salmonella test result
  - ph (numeric, optional) - pH level
  - tds (numeric, optional) - Total Dissolved Solids
  - remarks (text, optional) - Additional notes
  - tested_by (uuid) - References profiles
  - tested_at (timestamptz)
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 5. lab_settings
  Stores laboratory settings and configuration:
  - id (uuid, primary key)
  - lab_name (text)
  - lab_logo_url (text, optional)
  - address (text, optional)
  - phone (text, optional)
  - email (text, optional)
  - updated_by (uuid) - References profiles
  - updated_at (timestamptz)

  ## Security

  - Row Level Security (RLS) is enabled on all tables
  - Policies ensure users can only access data appropriate to their role:
    - Admins: Full access to all data
    - Analysts: Can view and update samples/results, view clients
    - Viewers: Read-only access to samples and results
  - All policies verify authentication using auth.uid()

  ## Important Notes

  1. Sample codes are auto-generated using a sequence and trigger
  2. All timestamps default to current time
  3. Foreign key constraints ensure data integrity
  4. Indexes are added for frequently queried columns
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  email text,
  phone text,
  address text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_code text UNIQUE NOT NULL,
  sample_type text NOT NULL,
  source text NOT NULL,
  collection_date date NOT NULL,
  received_date date NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  analyst_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE UNIQUE,
  tpc numeric,
  coliforms text CHECK (coliforms IN ('positive', 'negative', NULL)),
  ecoli_o157 text CHECK (ecoli_o157 IN ('positive', 'negative', NULL)),
  salmonella text CHECK (salmonella IN ('positive', 'negative', NULL)),
  ph numeric,
  tds numeric,
  remarks text,
  tested_by uuid REFERENCES profiles(id),
  tested_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create lab_settings table
CREATE TABLE IF NOT EXISTS lab_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name text NOT NULL,
  lab_logo_url text,
  address text,
  phone text,
  email text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lab_settings ENABLE ROW LEVEL SECURITY;

-- Create sequence for sample codes
CREATE SEQUENCE IF NOT EXISTS sample_code_seq START 1000;

-- Function to generate sample code
CREATE OR REPLACE FUNCTION generate_sample_code()
RETURNS text AS $$
DECLARE
  next_val integer;
  new_code text;
BEGIN
  next_val := nextval('sample_code_seq');
  new_code := 'LR-' || TO_CHAR(EXTRACT(YEAR FROM CURRENT_DATE), 'YYYY') || '-' || LPAD(next_val::text, 5, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate sample code
CREATE OR REPLACE FUNCTION set_sample_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.sample_code IS NULL OR NEW.sample_code = '' THEN
    NEW.sample_code := generate_sample_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sample_code_trigger
  BEFORE INSERT ON samples
  FOR EACH ROW
  EXECUTE FUNCTION set_sample_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lab_settings_updated_at
  BEFORE UPDATE ON lab_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for samples
CREATE POLICY "Authenticated users can view samples"
  ON samples FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert samples"
  ON samples FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can update samples"
  ON samples FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can delete samples"
  ON samples FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for test_results
CREATE POLICY "Authenticated users can view test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins and analysts can update test results"
  ON test_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can delete test results"
  ON test_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for lab_settings
CREATE POLICY "Authenticated users can view lab settings"
  ON lab_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert lab settings"
  ON lab_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update lab settings"
  ON lab_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_samples_client_id ON samples(client_id);
CREATE INDEX IF NOT EXISTS idx_samples_analyst_id ON samples(analyst_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON samples(collection_date);
CREATE INDEX IF NOT EXISTS idx_test_results_sample_id ON test_results(sample_id);

-- Insert default lab settings
INSERT INTO lab_settings (lab_name, lab_logo_url, address, phone, email)
VALUES ('Laboratory Name', NULL, 'Lab Address', '+1234567890', 'lab@example.com')
ON CONFLICT DO NOTHING;