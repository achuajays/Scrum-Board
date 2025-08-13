-- Create table without RLS
CREATE TABLE IF NOT EXISTS assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Make sure RLS is disabled (default is disabled, but just in case)
ALTER TABLE assignees DISABLE ROW LEVEL SECURITY;

INSERT INTO assignees (name, email, avatar_url) VALUES
  ('Adarsh Ajay', 'alice.johnson@company.com', 'https://images.pexels.com/photos/33405063/pexels-photo-33405063.jpeg'),
  ('Jos Booby', 'bob.smith@company.com', 'https://images.pexels.com/photos/33405063/pexels-photo-33405063.jpeg'),
  ('Kesav Gopan', 'carol.davis@company.com', 'https://images.pexels.com/photos/33405063/pexels-photo-33405063.jpeg'),
  ('Kasinathan', 'carol.davis@company.com', 'https://images.pexels.com/photos/33405063/pexels-photo-33405063.jpeg'),
  ('George', 'carol.davis@company.com', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=64')

