/*
  # Remove client_id from reports table

  1. Changes
    - Remove client_id column from reports table (already dropped in previous migration but column remains)
    - Remove related index
    
  2. Why
    - The clients table was removed in a previous migration
    - Reports should not reference client_id anymore
    - This is causing query errors in the Dashboard
*/

-- Drop the client_id column from reports table
ALTER TABLE reports DROP COLUMN IF EXISTS client_id;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_reports_client_id;
