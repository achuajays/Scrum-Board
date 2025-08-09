import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Clock, FileText, Image, Edit2, Trash2, Save } from 'lucide-react';
import { Issue, Comment, supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';

interface IssueModalProps {
  issue: Issue;
  workflowColumns: { id: string; title: string }[];
  onClose: () => void;
  onUpdate: (issue: Issue) => void;
}

type FormData = {
  title: string;
  description: string;
  priority: Issue['priority'];
  status: Issue['status'];
  assignee_name: string;
  story_points: number;
};

export const IssueModal: React.FC<IssueModalProps> = ({ issue, workflowColumns, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      assignee_name: issue.assignee_name,
      story_points: issue.story_points,
    },
  });

  useEffect(() => {
    loadComments();
  }, [issue.id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('issue_id', issue.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const updatedIssue = {
        ...issue,
        ...data,
      };
      await onUpdate(updatedIssue);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          issue_id: issue.id,
          content: newComment,
          image_url: newCommentImage || null,
          author_name: 'Current User',
          author_avatar: '',
        }]);

      if (error) throw error;
      setNewComment('');
      setNewCommentImage('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editingContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      setEditingCommentId(null);
      setEditingContent('');
      await loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const PRIORITY_OPTIONS = [
    { value: 'lowest', label: 'Lowest', color: 'bg-slate-300' },
    { value: 'low', label: 'Low', color: 'bg-blue-400' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-400' },
    { value: 'high', label: 'High', color: 'bg-orange-400' },
    { value: 'highest', label: 'Highest', color: 'bg-red-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {issue.issue_type.toUpperCase()}-{issue.id.slice(-4)}
                </h2>
                <p className="text-sm text-slate-600">{issue.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex space-x-1 mt-4">
              {[
                { id: 'details', label: 'Details', icon: FileText },
                { id: 'comments', label: 'Comments', icon: MessageSquare },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                  {id === 'comments' && comments.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-slate-200 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {workflowColumns.map(column => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assignee
                    </label>
                    <input
                      {...register('assignee_name')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Story Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register('story_points', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {issue.image_url && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Attachment
                    </label>
                    <img
                      src={issue.image_url}
                      alt="Issue attachment"
                      className="max-w-md rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{comment.author_name}</span>
                            <span className="text-xs text-slate-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEditing(comment)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                              title="Edit comment"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingContent('');
                                }}
                                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-700 text-sm">{comment.content}</p>
                            {comment.image_url && (
                              <img
                                src={comment.image_url}
                                alt="Comment attachment"
                                className="mt-2 max-w-xs rounded-lg border border-slate-200"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No comments yet</p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={3}
                    />
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Image className="w-4 h-4 text-slate-400" />
                          <input
                            type="url"
                            value={newCommentImage}
                            onChange={(e) => setNewCommentImage(e.target.value)}
                            placeholder="Optional: Add image URL"
                            className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {newCommentImage && (
                      <div className="mt-2">
                        <img
                          src={newCommentImage}
                          alt="Preview"
                          className="max-w-xs rounded-lg border border-slate-200"
                          onError={() => setNewCommentImage('')}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Add Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};