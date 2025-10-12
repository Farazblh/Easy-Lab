/*
  # Add custom_data column to test_results

  1. Changes
    - Add `custom_data` jsonb column to `test_results` table to store additional report-specific data
    - This column will store data for Air Quality, Water Quality, Food Handler Testing, Food Surface Testing, and Deboning reports

  2. Notes
    - The column is nullable to maintain backward compatibility with existing meat reports
    - JSONB type allows flexible storage of different report types' data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 'custom_data'
  ) THEN
    ALTER TABLE test_results ADD COLUMN custom_data jsonb;
  END IF;
END $$;
