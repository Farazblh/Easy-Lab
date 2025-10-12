/*
  # Fix RLS Policy for Clients Table

  1. Changes
    - Add INSERT policy for authenticated users on clients table
    - This allows creating new clients when generating reports
  
  2. Security
    - Only authenticated users can insert clients
    - Users can read all clients
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add INSERT policy for clients table
CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
