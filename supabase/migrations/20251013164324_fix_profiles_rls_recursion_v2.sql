/*
  # Fix Infinite Recursion in Profiles RLS Policies (v2)

  ## Problem
  The RLS policies on the profiles table were causing infinite recursion because they
  query the profiles table while checking permissions on the profiles table itself.

  ## Solution
  1. Create a security definer function to get user role without recursion
  2. Drop ALL existing RLS policies for all tables
  3. Create new policies using the helper function

  ## Changes
  - Created get_user_role() function with SECURITY DEFINER
  - Completely recreated all RLS policies
  - Fixed infinite recursion issue
*/

-- Create or replace the security definer function
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Drop ALL existing policies on profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END$$;

-- Create new profiles policies
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Drop and recreate samples policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'samples') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON samples';
    END LOOP;
END$$;

CREATE POLICY "Authenticated users can view samples"
  ON samples FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert samples"
  ON samples FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update samples"
  ON samples FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'analyst'))
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete samples"
  ON samples FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Drop and recreate test_results policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'test_results') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON test_results';
    END LOOP;
END$$;

CREATE POLICY "Authenticated users can view test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update test results"
  ON test_results FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'analyst'))
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete test results"
  ON test_results FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- Drop and recreate lab_settings policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lab_settings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON lab_settings';
    END LOOP;
END$$;

CREATE POLICY "Authenticated users can view lab settings"
  ON lab_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert lab settings"
  ON lab_settings FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update lab settings"
  ON lab_settings FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Drop and recreate reports policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reports';
    END LOOP;
END$$;

CREATE POLICY "Authenticated users can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('admin', 'analyst'))
  WITH CHECK (get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');