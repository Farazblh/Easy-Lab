/*
  # Add User Roles and Permissions System

  1. Changes
    - Add `role` column to profiles table (admin, analyst, viewer)
    - Set default role as 'analyst'
    - Update RLS policies to enforce role-based access control
    - Add function to check user roles

  2. Security
    - Only admins can manage users
    - Only admins can delete records
    - Analysts can create reports but not delete
    - Viewers can only read data
*/

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer'));
  END IF;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is analyst or admin
CREATE OR REPLACE FUNCTION can_create_reports()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'analyst')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update samples table RLS policies for delete
DROP POLICY IF EXISTS "Users can delete own samples" ON samples;
CREATE POLICY "Only admins can delete samples"
  ON samples FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update test_results table RLS policies for delete
DROP POLICY IF EXISTS "Users can delete own test results" ON test_results;
CREATE POLICY "Only admins can delete test results"
  ON test_results FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update reports table RLS policies for delete
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
CREATE POLICY "Only admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update samples table RLS policies for insert
DROP POLICY IF EXISTS "Users can create samples" ON samples;
CREATE POLICY "Analysts and admins can create samples"
  ON samples FOR INSERT
  TO authenticated
  WITH CHECK (can_create_reports());

-- Update test_results table RLS policies for insert
DROP POLICY IF EXISTS "Users can create test results" ON test_results;
CREATE POLICY "Analysts and admins can create test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (can_create_reports());

-- Update reports table RLS policies for insert
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Analysts and admins can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (can_create_reports());

-- Profiles table RLS for role management
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile except role"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR is_admin()));

-- Add policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());