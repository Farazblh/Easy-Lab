/*
  # Allow all users to delete reports

  1. Changes
    - Drop existing "Admins can delete reports" policy
    - Create new policy allowing all authenticated users to delete reports
  
  2. Security
    - All authenticated users can delete any report
    - Maintains existing select and insert policies unchanged
*/

-- Drop the admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

-- Create new policy allowing all authenticated users to delete reports
CREATE POLICY "All users can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (true);