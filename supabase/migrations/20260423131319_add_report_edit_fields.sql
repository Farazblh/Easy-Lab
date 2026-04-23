/*
  # Add Editable Fields to Reports

  ## Overview
  Adds fields to allow editing report details like consignee and supplier after report generation.

  ## Changes
  - Add `consignee` field to reports table
  - Add `supplier` field to reports table  
  - Add `updated_at` timestamp to track modifications
  - Add UPDATE policy to allow admins and analysts to edit their reports

  ## New Columns on reports table
  - `consignee` (text) - Consignee name, can be edited after report generation
  - `supplier` (text) - Supplier name, can be edited after report generation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - UPDATE policy allows admins and analysts to update reports
  - Data integrity maintained via RLS
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'consignee'
  ) THEN
    ALTER TABLE reports ADD COLUMN consignee text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE reports ADD COLUMN supplier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add UPDATE policy for admins and analysts
DROP POLICY IF EXISTS "Admins and analysts can update reports" ON reports;
CREATE POLICY "Admins and analysts can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

-- Create index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_reports_updated_at ON reports(updated_at);
