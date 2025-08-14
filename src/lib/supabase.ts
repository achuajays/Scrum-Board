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
  assignee_id?: string;
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

export type Assignee = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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

export const fetchAssignees = async (): Promise<Assignee[]> => {
  try {
    const { data, error } = await supabase
      .from('assignees')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assignees:', error);
    return [];
  }
};

export const fetchIssuesWithFilters = async (
  searchTerm?: string,
  assigneeId?: string
): Promise<Issue[]> => {
  try {
    let query = supabase
      .from('issues')
      .select('*')
      .order('position');

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply assignee filter if provided
    if (assigneeId && assigneeId.trim()) {
      // For now, we'll filter by assignee_name since we don't have assignee_id in the database yet
      const assignee = await supabase
        .from('assignees')
        .select('name')
        .eq('id', assigneeId)
        .single();
      
      if (assignee.data) {
        query = query.eq('assignee_name', assignee.data.name);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching filtered issues:', error);
    return [];
  }
};