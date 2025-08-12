import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

interface WorkflowModalProps {
  columns: { id: string; title: string }[];
  onClose: () => void;
  onUpdate: (columns: { id: string; title: string }[]) => void;
}

type FormData = {
  title: string;
};

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ columns, onClose, onUpdate }) => {
  const [localColumns, setLocalColumns] = useState(columns);
  const [originalColumns] = useState(columns);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const { showError, showWarning, showSuccess } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const handleAddColumn = (data: FormData) => {
    const newColumn = {
      id: data.title.toLowerCase().replace(/\s+/g, '_'),
      title: data.title,
    };
    
    setLocalColumns([...localColumns, newColumn]);
    setIsAddingColumn(false);
    reset();
  };

  const handleDeleteColumn = (columnId: string) => {
    // Prevent deletion of essential columns
    if (columnId === 'backlog' || columnId === 'done') {
      showWarning('Cannot delete column', 'Essential columns (Backlog and Done) cannot be deleted');
      return;
    }
    
    setColumnToDelete(columnId);
  };

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      setLocalColumns(localColumns.filter(col => col.id !== columnToDelete));
      setColumnToDelete(null);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Find deleted columns
      const deletedColumns = originalColumns.filter(
        originalCol => !localColumns.find(localCol => localCol.id === originalCol.id)
      );
      
      // Move issues from deleted columns to backlog
      for (const deletedColumn of deletedColumns) {
        if (deletedColumn.id !== 'backlog' && deletedColumn.id !== 'done') {
          const { error } = await supabase
            .from('issues')
            .update({ 
              status: 'backlog',
              updated_at: new Date().toISOString()
            })
            .eq('status', deletedColumn.id);
            
          if (error) {
            console.error(`Error moving issues from ${deletedColumn.id} to backlog:`, error);
            throw error;
          }
        }
      }
      
      // Update the workflow columns
      onUpdate(localColumns);
      showSuccess('Workflow updated', 'Your workflow changes have been saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving workflow changes:', error);
      showError('Save failed', 'Error saving changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...localColumns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setLocalColumns(newColumns);
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
            <h2 className="text-xl font-semibold text-slate-900">Manage Workflow</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {localColumns.map((column, index) => (
                <div
                  key={column.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                    <span className="font-medium text-slate-900">{column.title}</span>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                      {column.id}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveColumn(index, index - 1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {index < localColumns.length - 1 && (
                      <button
                        onClick={() => moveColumn(index, index + 1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      disabled={column.id === 'backlog' || column.id === 'done'}
                      className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete column"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isAddingColumn ? (
              <form onSubmit={handleSubmit(handleAddColumn)} className="space-y-3">
                <div>
                  <input
                    {...register('title', { required: 'Column title is required' })}
                    placeholder="Enter column title"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg"
                  >
                    Add Column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingColumn(false);
                      reset();
                    }}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="flex items-center justify-center w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Column
              </button>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <ConfirmationModal
          isOpen={columnToDelete !== null}
          title="Delete Column"
          message={`Are you sure you want to delete this column? All issues in this column will be moved to Backlog.`}
          confirmText="Delete Column"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDeleteColumn}
          onCancel={() => setColumnToDelete(null)}
        />
      </div>
    </div>
  );
};