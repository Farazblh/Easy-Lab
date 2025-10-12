/*
  # Replace Clients with Users

  1. Changes
    - Remove client_id from samples table
    - Remove client_id from reports table
    - Add user_id to samples table (references auth users)
    - Update reports to use user_id instead
    - Drop clients table
    - Update RLS policies

  2. Security
    - Users can view their own samples
    - Users can create samples for themselves
    - Authenticated users can view all samples
*/

-- Add user_id column to samples if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'samples' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE samples ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Migrate existing data: set user_id from profiles
UPDATE samples 
SET user_id = (SELECT id FROM profiles LIMIT 1)
WHERE user_id IS NULL;

-- Add user_id column to reports if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reports ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Migrate existing reports data
UPDATE reports 
SET user_id = (SELECT id FROM profiles LIMIT 1)
WHERE user_id IS NULL;

-- Drop the old foreign key constraint on samples if exists
ALTER TABLE samples DROP CONSTRAINT IF EXISTS samples_client_id_fkey;

-- Drop the old foreign key constraint on reports if exists
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_client_id_fkey;

-- Drop clients table
DROP TABLE IF EXISTS clients CASCADE;

-- Update samples table RLS policies
DROP POLICY IF EXISTS "Authenticated users can view samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can insert samples" ON samples;
DROP POLICY IF EXISTS "Authenticated users can update samples" ON samples;

CREATE POLICY "Users can view all samples"
  ON samples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own samples"
  ON samples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own samples"
  ON samples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update reports RLS policies
DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;

CREATE POLICY "Users can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
