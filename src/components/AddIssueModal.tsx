import React from 'react';
import { X, CheckSquare, Bug, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Issue, Assignee, fetchAssignees } from '../lib/supabase';

interface AddIssueModalProps {
  workflowColumns: { id: string; title: string }[];
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

export const AddIssueModal: React.FC<AddIssueModalProps> = ({ workflowColumns, onClose, onAdd }) => {
  const [attachmentMethod, setAttachmentMethod] = React.useState<'url' | 'upload'>('url');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [assignees, setAssignees] = React.useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = React.useState(true);

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

  React.useEffect(() => {
    const loadAssignees = async () => {
      setLoadingAssignees(true);
      const data = await fetchAssignees();
      setAssignees(data);
      setLoadingAssignees(false);
    };
    
    loadAssignees();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an image, PDF, or document file');
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview('');
    }

    // Clear URL input when file is uploaded
    setValue('image_url', '');
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: FormData) => {
    let finalImageUrl = data.image_url;

    // If a file was uploaded, convert it to base64
    if (uploadedFile) {
      try {
        finalImageUrl = await convertFileToBase64(uploadedFile);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        alert('Error processing uploaded file');
        return;
      }
    }

    // Find the selected assignee to get their avatar
    const selectedAssignee = assignees.find(assignee => assignee.name === data.assignee_name);
    const assigneeAvatar = selectedAssignee?.avatar_url || '';

    await onAdd({
      ...data,
      image_url: finalImageUrl,
      assignee_avatar: assigneeAvatar,
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
                  max="100"
                  {...register('story_points', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Attachment (Optional)
              </label>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentMethod('url');
                      removeUploadedFile();
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      attachmentMethod === 'url'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentMethod('upload');
                      setValue('image_url', '');
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      attachmentMethod === 'upload'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {attachmentMethod === 'url' ? (
                  <input
                    {...register('image_url')}
                    type="url"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter image URL"
                    disabled={!!uploadedFile}
                  />
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-slate-500">
                      Supported formats: Images (JPG, PNG, GIF, WebP), PDF, Word documents, Text files. Max size: 5MB
                    </p>
                  </div>
                )}

                {/* Preview uploaded file */}
                {uploadedFile && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-700">Uploaded:</span>
                        <span className="text-sm text-slate-600">{uploadedFile.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    {uploadPreview && (
                      <img
                        src={uploadPreview}
                        alt="Upload preview"
                        className="max-w-xs max-h-32 rounded border border-slate-200"
                      />
                    )}
                  </div>
                )}

                {/* Preview URL image */}
                {attachmentMethod === 'url' && watch('image_url') && !uploadedFile && (
                  <div className="mt-3">
                    <img
                      src={watch('image_url')}
                      alt="URL preview"
                      className="max-w-xs max-h-32 rounded border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
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