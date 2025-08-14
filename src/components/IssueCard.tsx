import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, AlertCircle, Bug, Zap } from 'lucide-react';
import { Issue } from '../lib/supabase';

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  isDragging?: boolean;
}

const ISSUE_TYPE_ICONS = {
  story: CheckSquare,
  task: CheckSquare,
  bug: Bug,
  epic: Zap,
};

const ISSUE_TYPE_COLORS = {
  story: 'text-green-500',
  task: 'text-blue-500',
  bug: 'text-red-500',
  epic: 'text-purple-500',
};

const PRIORITY_COLORS = {
  lowest: 'bg-slate-300',
  low: 'bg-blue-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  highest: 'bg-red-500',
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const TypeIcon = ISSUE_TYPE_ICONS[issue.issue_type];
  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 ${
        isCurrentlyDragging ? 'opacity-50 shadow-xl rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TypeIcon className={`w-5 h-5 ${ISSUE_TYPE_COLORS[issue.issue_type]}`} />
          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[issue.priority]}`} />
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
          {issue.issue_type}-{issue.id.slice(-4)}
        </div>
        <h3 className="font-medium text-slate-900 line-clamp-2 text-sm leading-snug">
          {issue.title}
        </h3>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {issue.assignee_name && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden">
                {issue.assignee_avatar ? (
                  <img
                    src={issue.assignee_avatar}
                    alt={issue.assignee_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={issue.assignee_avatar ? 'hidden' : ''}>
                  {issue.assignee_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium truncate max-w-20">
                {issue.assignee_name}
              </span>
            </div>
          )}
        </div>
        
        {issue.story_points > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {issue.story_points}
          </span>
        )}
      </div>
    </div>
  );
};