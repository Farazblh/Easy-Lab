/*
  # Lab Record Management System Database Schema with Signup Support

  ## Overview
  This migration creates the complete database schema for the Lab Record Management System (LRMS).

  ## Tables Created
  1. profiles - User information
  2. clients - Laboratory client information
  3. samples - Sample information
  4. test_results - Test results for each sample
  5. lab_settings - Laboratory settings and configuration

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can create their own profile during signup
  - Admins have full access
  - Analysts can manage clients, samples, and test results
  - Viewers have read-only access
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')) DEFAULT 'analyst',
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

DROP TRIGGER IF EXISTS generate_sample_code_trigger ON samples;
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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_samples_updated_at ON samples;
CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_test_results_updated_at ON test_results;
CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_lab_settings_updated_at ON lab_settings;
CREATE TRIGGER update_lab_settings_updated_at
  BEFORE UPDATE ON lab_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
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
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and analysts can insert clients" ON clients;
CREATE POLICY "Admins and analysts can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Admins and analysts can update clients" ON clients;
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

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
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
DROP POLICY IF EXISTS "Authenticated users can view samples" ON samples;
CREATE POLICY "Authenticated users can view samples"
  ON samples FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and analysts can insert samples" ON samples;
CREATE POLICY "Admins and analysts can insert samples"
  ON samples FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Admins and analysts can update samples" ON samples;
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

DROP POLICY IF EXISTS "Admins can delete samples" ON samples;
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
DROP POLICY IF EXISTS "Authenticated users can view test results" ON test_results;
CREATE POLICY "Authenticated users can view test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and analysts can insert test results" ON test_results;
CREATE POLICY "Admins and analysts can insert test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Admins and analysts can update test results" ON test_results;
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

DROP POLICY IF EXISTS "Admins can delete test results" ON test_results;
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
DROP POLICY IF EXISTS "Authenticated users can view lab settings" ON lab_settings;
CREATE POLICY "Authenticated users can view lab settings"
  ON lab_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert lab settings" ON lab_settings;
CREATE POLICY "Admins can insert lab settings"
  ON lab_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update lab settings" ON lab_settings;
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