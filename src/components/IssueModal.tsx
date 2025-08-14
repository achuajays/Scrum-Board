import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Clock, FileText, Image, Edit2, Trash2, Save, AlertTriangle, Download, Eye } from 'lucide-react';
import { Issue, Comment, Assignee, supabase, fetchAssignees } from '../lib/supabase';
import { useForm } from 'react-hook-form';

interface IssueModalProps {
  issue: Issue;
  workflowColumns: { id: string; title: string }[];
  onClose: () => void;
  onUpdate: (issue: Issue) => void;
  onDelete: (issueId: string) => void;
}

type FormData = {
  title: string;
  description: string;
  priority: Issue['priority'];
  status: Issue['status'];
  assignee_name: string;
  story_points: number;
};

export const IssueModal: React.FC<IssueModalProps> = ({ issue, workflowColumns, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(true);

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

  // Helper function to extract MIME type from Base64 data URL
  const getMimeTypeFromDataUrl = (dataUrl: string): string | null => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match ? match[1] : null;
  };

  // Helper function to get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const extensions: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    };
    return extensions[mimeType] || 'FILE';
  };

  // Helper function to render attachment based on file type
  const renderAttachment = (url: string) => {
    if (!url) return null;

    // Handle regular URLs (not Base64)
    if (!url.startsWith('data:')) {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Attachment
          </label>
          <img
            src={url}
            alt="Issue attachment"
            className="max-w-md rounded-lg border border-slate-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-700">Attachment (unable to display)</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                View
              </a>
            </div>
          </div>
        </div>
      );
    }

    const mimeType = getMimeTypeFromDataUrl(url);
    if (!mimeType) return null;

    // Handle images
    if (mimeType.startsWith('image/')) {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Image Attachment
          </label>
          <img
            src={url}
            alt="Issue attachment"
            className="max-w-md rounded-lg border border-slate-200 shadow-sm"
          />
        </div>
      );
    }

    // Handle PDFs
    if (mimeType === 'application/pdf') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            PDF Attachment
          </label>
          <div className="border border-slate-200 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">PDF Document</p>
                  <p className="text-sm text-slate-500">Click to view or download</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </a>
                <a
                  href={url}
                  download
                  className="inline-flex items-center px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle other document types
    const fileExtension = getFileExtension(mimeType);
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Document Attachment
        </label>
        <div className="border border-slate-200 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{fileExtension} Document</p>
                <p className="text-sm text-slate-500">Click to view or download</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </a>
              <a
                href={url}
                download
                className="inline-flex items-center px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };
  useEffect(() => {
    loadComments();
    loadAssignees();
  }, [issue.id]);

  const loadAssignees = async () => {
    setLoadingAssignees(true);
    const data = await fetchAssignees();
    setAssignees(data);
    setLoadingAssignees(false);
  };

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
      // Find the selected assignee to get their avatar
      const selectedAssignee = assignees.find(assignee => assignee.name === data.assignee_name);
      const assigneeAvatar = selectedAssignee?.avatar_url || '';

      const updatedIssue = {
        ...issue,
        ...data,
        assignee_avatar: assigneeAvatar,
      };
      await onUpdate(updatedIssue);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(issue.id);
      onClose();
    } catch (error) {
      console.error('Error deleting issue:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-700"
                  title="Delete issue"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                    <select
                      {...register('assignee_name')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingAssignees}
                    >
                      <option value="">
                        {loadingAssignees ? 'Loading assignees...' : 'Select assignee (optional)'}
                      </option>
                      {assignees.map(assignee => (
                        <option key={assignee.id} value={assignee.name}>
                          {assignee.name}
                        </option>
                      ))}
                    </select>
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
                  renderAttachment(issue.image_url)
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
                              <div className="mt-2">
                                {renderAttachment(comment.image_url)}
                              </div>
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
                        {renderAttachment(newCommentImage)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Delete Issue</h3>
                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-slate-700 mb-2">
                    Are you sure you want to delete this issue?
                  </p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="font-medium text-slate-900 text-sm">
                      {issue.issue_type.toUpperCase()}-{issue.id.slice(-4)}: {issue.title}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    All comments and attachments will also be permanently deleted.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Issue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};