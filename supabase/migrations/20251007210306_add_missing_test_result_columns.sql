/*
  # Add Missing Test Result Columns

  1. Changes
    - Add listeria column to test_results table
    - Add s_aureus column to test_results table
    - These are required for the microbiological testing report

  2. Column Details
    - listeria: text (for test results like "Nil", "Detected", etc.)
    - s_aureus: text (for S. aureus test values)
*/

-- Add listeria column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 'listeria'
  ) THEN
    ALTER TABLE test_results ADD COLUMN listeria text;
  END IF;
END $$;

-- Add s_aureus column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 's_aureus'
  ) THEN
    ALTER TABLE test_results ADD COLUMN s_aureus text;
  END IF;
END $$;
