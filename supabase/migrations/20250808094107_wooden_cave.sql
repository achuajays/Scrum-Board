/*
  # Create Scrum Board Schema

  1. New Tables
    - `issues`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `issue_type` (text: story, task, bug, epic)
      - `priority` (text: lowest, low, medium, high, highest)
      - `status` (text: backlog, todo, in_progress, dev, uat, done)
      - `story_points` (integer)
      - `assignee_name` (text)
      - `assignee_avatar` (text)
      - `position` (integer, for ordering within columns)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, foreign key)
      - `content` (text)
      - `author_name` (text)
      - `author_avatar` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (since this is a demo)
*/

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  issue_type text DEFAULT 'task' CHECK (issue_type IN ('story', 'task', 'bug', 'epic')),
  priority text DEFAULT 'medium' CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
  status text DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'dev', 'uat', 'done')),
  story_points integer DEFAULT 0,
  assignee_name text DEFAULT '',
  assignee_avatar text DEFAULT '',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text NOT NULL,
  author_avatar text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read issues"
  ON issues
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert issues"
  ON issues
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update issues"
  ON issues
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete issues"
  ON issues
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can read comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update comments"
  ON comments
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete comments"
  ON comments
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS issues_status_position_idx ON issues(status, position);
CREATE INDEX IF NOT EXISTS comments_issue_id_idx ON comments(issue_id);

-- Insert sample data
INSERT INTO issues (title, description, issue_type, priority, status, story_points, assignee_name, assignee_avatar, position) VALUES
  ('User Authentication System', 'Implement OAuth 2.0 login with Google and GitHub providers', 'story', 'high', 'backlog', 8, 'Alice Johnson', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=64', 1),
  ('Fix responsive header layout', 'Header breaks on mobile devices below 480px width', 'bug', 'medium', 'backlog', 3, 'Bob Smith', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=64', 2),
  ('Database migration scripts', 'Create automated migration system for schema updates', 'task', 'high', 'todo', 5, 'Carol Davis', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=64', 1),
  ('API rate limiting', 'Implement rate limiting for public API endpoints', 'story', 'medium', 'todo', 3, 'David Wilson', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=64', 2),
  ('Payment integration', 'Integrate Stripe payment processing for subscriptions', 'epic', 'highest', 'in_progress', 13, 'Eve Brown', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=64', 1),
  ('Search functionality', 'Add full-text search with filtering and sorting', 'story', 'medium', 'in_progress', 8, 'Frank Miller', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=64', 2),
  ('Unit test coverage', 'Increase test coverage to 90% across all modules', 'task', 'low', 'dev', 2, 'Grace Lee', 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?w=64', 1),
  ('Performance optimization', 'Optimize database queries and add caching layer', 'task', 'high', 'dev', 5, 'Henry Clark', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=64', 2),
  ('User dashboard redesign', 'Redesign dashboard with modern UI components', 'story', 'medium', 'uat', 8, 'Ivy Wilson', 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=64', 1),
  ('Email notification system', 'Send automated emails for important user actions', 'story', 'low', 'done', 5, 'Jack Thompson', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=64', 1),
  ('Security audit fixes', 'Address all findings from external security audit', 'task', 'highest', 'done', 8, 'Kate Martinez', 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?w=64', 2);

-- Insert sample comments
INSERT INTO comments (issue_id, content, author_name, author_avatar) VALUES
  ((SELECT id FROM issues WHERE title = 'User Authentication System' LIMIT 1), 'We should prioritize Google OAuth first as most users prefer it.', 'Alice Johnson', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=64'),
  ((SELECT id FROM issues WHERE title = 'User Authentication System' LIMIT 1), 'Agreed. GitHub can be added in a follow-up story.', 'Bob Smith', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=64'),
  ((SELECT id FROM issues WHERE title = 'Payment integration' LIMIT 1), 'Integration is 70% complete. Testing subscription flows now.', 'Eve Brown', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=64');