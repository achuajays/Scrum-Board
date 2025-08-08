import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Issue = {
  id: string;
  title: string;
  description: string;
  issue_type: 'story' | 'task' | 'bug' | 'epic';
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
  status: 'backlog' | 'todo' | 'in_progress' | 'dev' | 'uat' | 'done';
  story_points: number;
  assignee_name: string;
  assignee_avatar: string;
  image_url?: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  issue_id: string;
  content: string;
  image_url?: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  updated_at?: string;
};

export type Column = {
  id: string;
  title: string;
  issues: Issue[];
};

export type ProjectInfo = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};