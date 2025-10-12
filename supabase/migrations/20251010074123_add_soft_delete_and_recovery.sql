/*
  # Add Soft Delete and Recovery Functionality

  1. Changes
    - Add `deleted_at` column to samples, test_results, and reports tables
    - Add `deleted_by` column to track who deleted the record
    - Update RLS policies to hide deleted records by default
    - Create recovery functions for admins

  2. Security
    - Only admins can view and recover deleted records
    - Soft deletes are tracked with timestamp and user
*/

-- Add deleted_at and deleted_by columns to samples
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'samples' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE samples ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'samples' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE samples ADD COLUMN deleted_by uuid REFERENCES profiles(id) DEFAULT NULL;
  END IF;
END $$;

-- Add deleted_at and deleted_by columns to test_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE test_results ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE test_results ADD COLUMN deleted_by uuid REFERENCES profiles(id) DEFAULT NULL;
  END IF;
END $$;

-- Add deleted_at and deleted_by columns to reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE reports ADD COLUMN deleted_by uuid REFERENCES profiles(id) DEFAULT NULL;
  END IF;
END $$;

-- Update samples SELECT policy to hide deleted records
DROP POLICY IF EXISTS "Users can view all samples" ON samples;
CREATE POLICY "Users can view non-deleted samples"
  ON samples FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Add policy for admins to view deleted samples
CREATE POLICY "Admins can view deleted samples"
  ON samples FOR SELECT
  TO authenticated
  USING (is_admin() AND deleted_at IS NOT NULL);

-- Update test_results SELECT policy to hide deleted records
DROP POLICY IF EXISTS "Users can view all test results" ON test_results;
CREATE POLICY "Users can view non-deleted test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Add policy for admins to view deleted test_results
CREATE POLICY "Admins can view deleted test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (is_admin() AND deleted_at IS NOT NULL);

-- Update reports SELECT policy to hide deleted records
DROP POLICY IF EXISTS "Users can view all reports" ON reports;
CREATE POLICY "Users can view non-deleted reports"
  ON reports FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Add policy for admins to view deleted reports
CREATE POLICY "Admins can view deleted reports"
  ON reports FOR SELECT
  TO authenticated
  USING (is_admin() AND deleted_at IS NOT NULL);

-- Update DELETE policies to use soft delete
DROP POLICY IF EXISTS "Only admins can delete samples" ON samples;
CREATE POLICY "Only admins can soft delete samples"
  ON samples FOR UPDATE
  TO authenticated
  USING (is_admin() AND deleted_at IS NULL)
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Only admins can delete test results" ON test_results;
CREATE POLICY "Only admins can soft delete test results"
  ON test_results FOR UPDATE
  TO authenticated
  USING (is_admin() AND deleted_at IS NULL)
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Only admins can delete reports" ON reports;
CREATE POLICY "Only admins can soft delete reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_admin() AND deleted_at IS NULL)
  WITH CHECK (is_admin());

-- Create function to recover deleted records
CREATE OR REPLACE FUNCTION recover_sample(sample_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can recover deleted samples';
  END IF;

  UPDATE samples
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = sample_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION recover_test_result(test_result_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can recover deleted test results';
  END IF;

  UPDATE test_results
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = test_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION recover_report(report_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can recover deleted reports';
  END IF;

  UPDATE reports
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;