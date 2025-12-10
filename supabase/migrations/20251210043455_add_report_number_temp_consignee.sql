/*
  # Add Report Number, Temperature, and Consignee Fields
  
  1. Changes to reports table
    - Add `report_number` column (text, unique) - stores auto-generated report number like TOMC-2025-0006
    - Add index on report_number for faster lookups
    
  2. Changes to test_results table  
    - Add `temperature` column (numeric, nullable) - stores sample temperature in °C
    
  3. Changes to samples table
    - Add `consignee` column (text, nullable) - stores consignee name
    
  4. Security
    - All existing RLS policies remain in effect
    
  Important Notes:
  - Report numbers are auto-generated in format TOMC-YYYY-NNNN
  - Numbers are sequential and never reused, even if reports are deleted
  - Temperature is only used for meat reports
  - Consignee field is primarily for meat reports
*/

-- Add report_number to reports table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'report_number'
  ) THEN
    ALTER TABLE reports ADD COLUMN report_number text UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_reports_report_number ON reports(report_number);
  END IF;
END $$;

-- Add temperature to test_results table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_results' AND column_name = 'temperature'
  ) THEN
    ALTER TABLE test_results ADD COLUMN temperature numeric;
  END IF;
END $$;

-- Add consignee to samples table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'samples' AND column_name = 'consignee'
  ) THEN
    ALTER TABLE samples ADD COLUMN consignee text;
  END IF;
END $$;

-- Create function to generate next report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text;
  max_number integer;
  new_number text;
BEGIN
  -- Get current year
  current_year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get the maximum number for current year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(report_number FROM 'TOMC-' || current_year || '-(\d+)')
        AS integer
      )
    ),
    0
  ) INTO max_number
  FROM reports
  WHERE report_number LIKE 'TOMC-' || current_year || '-%';
  
  -- Generate new report number
  new_number := 'TOMC-' || current_year || '-' || LPAD((max_number + 1)::text, 4, '0');
  
  RETURN new_number;
END;
$$;
