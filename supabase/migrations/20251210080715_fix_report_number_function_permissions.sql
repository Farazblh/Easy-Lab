/*
  # Fix Report Number Function Permissions

  1. Changes
    - Recreate generate_report_number function with SECURITY DEFINER
    - This ensures the function always has permission to read reports table
    - Prevents intermittent failures when called by different users

  2. Security
    - Function is marked as SECURITY DEFINER to run with elevated privileges
    - This is safe as it only reads data and generates sequential numbers
*/

-- Recreate function with SECURITY DEFINER to ensure it always has permission
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_report_number() TO authenticated;
