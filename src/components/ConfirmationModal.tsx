import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-blue-500 hover:bg-blue-600 text-white';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onCancel}
        />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmVariant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  confirmVariant === 'danger' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700">{message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${confirmButtonClass}`}
              >
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};