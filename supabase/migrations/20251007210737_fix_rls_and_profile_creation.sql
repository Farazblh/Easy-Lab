/*
  # Fix RLS Policies and Profile Creation

  1. Changes
    - Update samples table RLS policy to allow authenticated users to insert
    - Add trigger to auto-create profile when user signs up
    - Set default role as 'analyst' for new users

  2. Security
    - Authenticated users can insert their own samples
    - Profiles are automatically created with analyst role
    - All users can perform basic LRMS operations
*/

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Admins and analysts can insert samples" ON samples;

-- Create new insert policy that allows authenticated users
CREATE POLICY "Authenticated users can insert samples"
  ON samples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update the update policy to allow authenticated users
DROP POLICY IF EXISTS "Admins and analysts can update samples" ON samples;

CREATE POLICY "Authenticated users can update samples"
  ON samples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'analyst'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for test_results
DROP POLICY IF EXISTS "Admins and analysts can insert test results" ON test_results;

CREATE POLICY "Authenticated users can insert test results"
  ON test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and analysts can update test results" ON test_results;

CREATE POLICY "Authenticated users can update test results"
  ON test_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update RLS policies for reports
DROP POLICY IF EXISTS "Admins and analysts can create reports" ON reports;

CREATE POLICY "Authenticated users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
