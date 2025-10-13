/*
  # Add Reports Table

  ## Overview
  Adds reports table for storing generated PDF reports.

  ## New Table: reports
  - id (uuid, primary key)
  - sample_id (uuid) - References samples table
  - pdf_url (text) - URL/path to stored PDF
  - generated_by (uuid) - References profiles
  - date_generated (timestamptz)
  - created_at (timestamptz)

  ## Security
  - RLS enabled
  - All authenticated users can view reports
  - Admins and analysts can insert reports
  - Admins and analysts can delete reports
*/

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE NOT NULL,
  pdf_url text,
  generated_by uuid REFERENCES profiles(id),
  date_generated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;
CREATE POLICY "Authenticated users can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and analysts can insert reports" ON reports;
CREATE POLICY "Admins and analysts can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

DROP POLICY IF EXISTS "Admins and analysts can delete reports" ON reports;
CREATE POLICY "Admins and analysts can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_sample_id ON reports(sample_id);
CREATE INDEX IF NOT EXISTS idx_reports_date_generated ON reports(date_generated);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);