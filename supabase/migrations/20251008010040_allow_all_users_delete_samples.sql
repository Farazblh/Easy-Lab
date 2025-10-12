/*
  # Allow All Users to Delete Samples

  1. Changes
    - Drop existing delete policy that only allows admins
    - Create new delete policy that allows all authenticated users
    
  2. Security
    - All authenticated users can delete samples
*/

-- Drop the admin-only delete policy
DROP POLICY IF EXISTS "Admins can delete samples" ON samples;

-- Create new policy allowing all authenticated users to delete
CREATE POLICY "Authenticated users can delete samples"
  ON samples
  FOR DELETE
  TO authenticated
  USING (true);
