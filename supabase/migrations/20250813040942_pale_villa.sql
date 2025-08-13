/*
  # Create Assignees Table

  1. New Tables
    - `assignees`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `email` (text, optional)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on assignees table
    - Add policy for public read access

  3. Sample Data
    - Insert sample assignees based on existing data
*/

-- Create assignees table
CREATE TABLE IF NOT EXISTS assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read assignees"
  ON assignees
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert assignees"
  ON assignees
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update assignees"
  ON assignees
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete assignees"
  ON assignees
  FOR DELETE
  TO public
  USING (true);

-- Insert sample assignees
INSERT INTO assignees (name, email, avatar_url) VALUES
  ('Alice Johnson', 'alice.johnson@company.com', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=64'),
  ('Bob Smith', 'bob.smith@company.com', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=64'),
  ('Carol Davis', 'carol.davis@company.com', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=64'),
  ('David Wilson', 'david.wilson@company.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=64'),
  ('Eve Brown', 'eve.brown@company.com', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=64'),
  ('Frank Miller', 'frank.miller@company.com', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=64'),
  ('Grace Lee', 'grace.lee@company.com', 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?w=64'),
  ('Henry Clark', 'henry.clark@company.com', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=64'),
  ('Ivy Wilson', 'ivy.wilson@company.com', 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=64'),
  ('Jack Thompson', 'jack.thompson@company.com', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=64'),
  ('Kate Martinez', 'kate.martinez@company.com', 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?w=64')
ON CONFLICT (name) DO NOTHING;