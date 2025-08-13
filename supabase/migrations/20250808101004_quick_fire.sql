/*
  # Add Image Support and Project Information

  1. Schema Changes
    - Add `image_url` column to issues table for optional image attachments
    - Create `project_info` table for key-value project information storage

  2. New Tables
    - `project_info`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on project_info table
    - Add policies for public access
*/

-- Add image_url column to issues table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'issues' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE issues ADD COLUMN image_url text;
  END IF;
END $$;

-- Create project_info table
CREATE TABLE IF NOT EXISTS project_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_info ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read project_info"
  ON project_info
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert project_info"
  ON project_info
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update project_info"
  ON project_info
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete project_info"
  ON project_info
  FOR DELETE
  TO public
  USING (true);

-- Insert sample project information
INSERT INTO project_info (key, value) VALUES
  ('Project Manager', 'Sarah Johnson - sarah.johnson@company.com'),
  ('Tech Stack', 'React, TypeScript, Tailwind CSS, Supabase, Vite'),
  ('Project Deadline', 'March 15, 2025'),
  ('Repository', 'https://github.com/company/mcmillan-scrum-board'),
  ('Environment', 'Production: https://mcmillan.company.com\nStaging: https://staging-mcmillan.company.com'),
  ('Team Size', '8 developers, 2 designers, 1 product manager'),
  ('Sprint Duration', '2 weeks'),
  ('Definition of Done', '- Code reviewed by 2+ developers\n- Unit tests written and passing\n- Integration tests passing\n- Documentation updated\n- Deployed to staging\n- QA approval received')
ON CONFLICT (key) DO NOTHING;