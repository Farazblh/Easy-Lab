/*
  # Fix Report Number Generation - Prevent Duplicates

  1. New Table
    - `report_number_sequence` - tracks the last used number for each year
    - Uses row-level locking to prevent concurrent access
    - Ensures sequential, non-repeating numbers

  2. Updated Function
    - Uses SELECT FOR UPDATE to lock the row
    - Atomically increments and returns the next number
    - Prevents race conditions and duplicate numbers

  3. Security
    - Enable RLS on the sequence table
    - Grant proper permissions to authenticated users
*/

-- Create sequence table to track report numbers by year
CREATE TABLE IF NOT EXISTS report_number_sequence (
  year text PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_number_sequence ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read sequence"
  ON report_number_sequence FOR SELECT
  TO authenticated
  USING (true);

-- Only the function can update (via SECURITY DEFINER)
CREATE POLICY "Only function can update sequence"
  ON report_number_sequence FOR UPDATE
  TO authenticated
  USING (false);

-- Allow the function to insert new years
CREATE POLICY "Only function can insert sequence"
  ON report_number_sequence FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Recreate function with atomic increment
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_number integer;
  new_report_number text;
BEGIN
  -- Get current year
  current_year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Try to get and lock the row for this year
  SELECT last_number + 1 INTO next_number
  FROM report_number_sequence
  WHERE year = current_year
  FOR UPDATE;
  
  -- If row doesn't exist, create it
  IF NOT FOUND THEN
    -- Initialize with 1 for new year
    INSERT INTO report_number_sequence (year, last_number)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = report_number_sequence.last_number + 1,
        updated_at = now()
    RETURNING last_number INTO next_number;
  ELSE
    -- Update the existing row
    UPDATE report_number_sequence
    SET last_number = next_number,
        updated_at = now()
    WHERE year = current_year;
  END IF;
  
  -- Generate report number in format TOMC-YYYY-NNNN
  new_report_number := 'TOMC-' || current_year || '-' || LPAD(next_number::text, 4, '0');
  
  RETURN new_report_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_report_number() TO authenticated;

-- Initialize the sequence with the current max number from existing reports
DO $$
DECLARE
  current_year text;
  max_num integer;
BEGIN
  current_year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Find the highest number used in current year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(report_number FROM 'TOMC-' || current_year || '-(\d+)')
        AS integer
      )
    ),
    0
  ) INTO max_num
  FROM reports
  WHERE report_number LIKE 'TOMC-' || current_year || '-%';
  
  -- Insert or update the sequence for current year
  INSERT INTO report_number_sequence (year, last_number)
  VALUES (current_year, max_num)
  ON CONFLICT (year) DO UPDATE
  SET last_number = GREATEST(report_number_sequence.last_number, max_num);
END $$;
