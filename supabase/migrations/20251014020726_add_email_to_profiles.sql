/*
  # Add email column to profiles table

  1. Changes
    - Add `email` column to `profiles` table
    - Update existing profile with email from auth.users
  
  2. Security
    - No RLS changes needed
*/

-- Add email column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update Junaid Gabol's profile with email
UPDATE profiles 
SET email = 'gabolskills@gmail.com'
WHERE id = '3afb33a2-4a42-4679-ace8-fe82ac60630a';
