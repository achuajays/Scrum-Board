import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProjectInfoModalProps {
  onClose: () => void;
}

type ProjectInfo = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({ onClose }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectInfo();
  }, []);

  const loadProjectInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('project_info')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProjectInfo(data || []);
    } catch (error) {
      console.error('Error loading project info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      const { error } = await supabase
        .from('project_info')
        .insert([{
          key: newKey.trim(),
          value: newValue.trim(),
        }]);

      if (error) throw error;
      
      setNewKey('');
      setNewValue('');
      setIsAddingNew(false);
      await loadProjectInfo();
    } catch (error) {
      console.error('Error adding project info:', error);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editKey.trim() || !editValue.trim()) return;

    try {
      const { error } = await supabase
        .from('project_info')
        .update({
          key: editKey.trim(),
          value: editValue.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      setEditKey('');
      setEditValue('');
      await loadProjectInfo();
    } catch (error) {
      console.error('Error updating project info:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this information?')) return;

    try {
      const { error } = await supabase
        .from('project_info')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadProjectInfo();
    } catch (error) {
      console.error('Error deleting project info:', error);
    }
  };

  const startEditing = (info: ProjectInfo) => {
    setEditingId(info.id);
    setEditKey(info.key);
    setEditValue(info.value);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditKey('');
    setEditValue('');
  };

  const cancelAdding = () => {
    setIsAddingNew(false);
    setNewKey('');
    setNewValue('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-slate-900">Project Information</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              {projectInfo.map(info => (
                <div
                  key={info.id}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  {editingId === info.id ? (
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Key
                        </label>
                        <input
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Value
                        </label>
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter value"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(info.id)}
                          className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 mb-1">{info.key}</div>
                        <div className="text-slate-700 text-sm whitespace-pre-wrap">{info.value}</div>
                        <div className="text-xs text-slate-500 mt-2">
                          Created: {new Date(info.created_at).toLocaleDateString()}
                          {info.updated_at && info.updated_at !== info.created_at && (
                            <span className="ml-2">
                              • Updated: {new Date(info.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => startEditing(info)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(info.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {projectInfo.length === 0 && !isAddingNew && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>No project information added yet</p>
                </div>
              )}

              {isAddingNew ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Key
                      </label>
                      <input
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g., Project Manager, Tech Stack, Deadline"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Value
                      </label>
                      <textarea
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter the information details"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAdd}
                        disabled={!newKey.trim() || !newValue.trim()}
                        className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                      <button
                        onClick={cancelAdding}
                        className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Project Information
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};