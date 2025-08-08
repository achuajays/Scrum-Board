import React from 'react';
import { X, CheckSquare, Bug, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Issue } from '../lib/supabase';

interface AddIssueModalProps {
  onClose: () => void;
  onAdd: (issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'position'>) => void;
}

type FormData = {
  title: string;
  description: string;
  issue_type: Issue['issue_type'];
  priority: Issue['priority'];
  status: Issue['status'];
  assignee_name: string;
  story_points: number;
  image_url: string;
};

const ISSUE_TYPES = [
  { value: 'story', label: 'Story', icon: CheckSquare, color: 'text-green-500 bg-green-50 border-green-200' },
  { value: 'task', label: 'Task', icon: CheckSquare, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500 bg-red-50 border-red-200' },
  { value: 'epic', label: 'Epic', icon: Zap, color: 'text-purple-500 bg-purple-50 border-purple-200' },
];

const PRIORITY_OPTIONS = [
  { value: 'lowest', label: 'Lowest', color: 'bg-slate-300' },
  { value: 'low', label: 'Low', color: 'bg-blue-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-400' },
  { value: 'highest', label: 'Highest', color: 'bg-red-500' },
];

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'dev', label: 'Dev' },
  { value: 'uat', label: 'UAT' },
  { value: 'done', label: 'Done' },
];

export const AddIssueModal: React.FC<AddIssueModalProps> = ({ onClose, onAdd }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      issue_type: 'task',
      priority: 'medium',
      status: 'backlog',
      assignee_name: '',
      story_points: 0,
      image_url: '',
    },
  });

  const selectedIssueType = watch('issue_type');

  const onSubmit = async (data: FormData) => {
    await onAdd({
      ...data,
      assignee_avatar: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Add New Issue</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter issue title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Issue Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ISSUE_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setValue('issue_type', type.value as any)}
                      className={`flex items-center p-3 border-2 rounded-lg transition-all duration-200 ${
                        selectedIssueType === type.value
                          ? type.color
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the issue in detail"
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
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  placeholder="Enter assignee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Story Points
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('story_points', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Attachment Image (Optional)
              </label>
              <input
                {...register('image_url')}
                type="url"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image URL"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};