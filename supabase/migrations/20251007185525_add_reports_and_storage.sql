/*
  # Add Reports Table and Storage for LRMS

  ## Overview
  This migration adds functionality for storing generated PDF reports and managing lab logo uploads.

  ## New Tables

  ### 1. reports
  Stores metadata for generated PDF reports:
  - id (uuid, primary key)
  - sample_id (uuid) - References samples table
  - client_id (uuid) - References clients table
  - pdf_url (text) - URL/path to stored PDF
  - generated_by (uuid) - References profiles (user who generated)
  - date_generated (timestamptz) - When report was created
  - created_at (timestamptz)

  ## Storage Buckets

  - Creates 'lab-logos' bucket for lab logo images
  - Creates 'reports' bucket for generated PDF reports
  - Both buckets configured with proper access policies

  ## Security

  - RLS enabled on reports table
  - All authenticated users can view reports
  - Only admins and analysts can generate reports
  - Storage buckets have appropriate public/private access

  ## Important Notes

  1. Reports are linked to both samples and clients for easy querying
  2. Storage buckets allow for file uploads from the application
  3. PDF URLs are stored as text for flexibility (can be local paths or URLs)
*/

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  pdf_url text,
  generated_by uuid REFERENCES profiles(id),
  date_generated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Authenticated users can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and analysts can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_sample_id ON reports(sample_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_date_generated ON reports(date_generated);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);

-- Create storage buckets for logos and reports
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('lab-logos', 'lab-logos', true),
  ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lab-logos bucket (public read, admin write)
CREATE POLICY "Public can view lab logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lab-logos');

CREATE POLICY "Admins can upload lab logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lab-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update lab logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lab-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lab logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lab-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage policies for reports bucket (authenticated read, admin/analyst write)
CREATE POLICY "Authenticated users can view reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'reports');

CREATE POLICY "Admins and analysts can upload reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can delete report files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );