/*
  # Fix Reports Table - Make client_id Nullable

  1. Changes
    - Make client_id column nullable in reports table since we don't use clients anymore
    
  2. Reason
    - Reports are linked to samples directly, not to clients
    - The NOT NULL constraint on client_id is causing report generation to fail
*/

-- Make client_id nullable
ALTER TABLE reports ALTER COLUMN client_id DROP NOT NULL;
