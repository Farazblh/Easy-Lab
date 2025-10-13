/*
  # Fix Admin User Deletion

  1. Changes
    - Simplify DELETE policy on profiles table
    - Use direct role check instead of is_admin() function
    - Ensure admins can delete any user except protected accounts

  2. Security
    - Only users with role='admin' can delete profiles
    - Main admin account remains protected by trigger
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create simple, clear DELETE policy for admins
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Ensure ALL operations policy doesn't interfere
CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
