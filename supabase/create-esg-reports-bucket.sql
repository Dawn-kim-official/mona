-- Create ESG Reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'esg-reports',
  'esg-reports', 
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Create RLS policies for ESG Reports
CREATE POLICY "Anyone can view ESG reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'esg-reports');

CREATE POLICY "Admins can upload ESG reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'esg-reports' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update ESG reports" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'esg-reports' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete ESG reports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'esg-reports' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );