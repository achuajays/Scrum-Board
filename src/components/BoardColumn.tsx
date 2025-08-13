import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Issue } from '../lib/supabase';
import { IssueCard } from './IssueCard';

interface BoardColumnProps {
  column: Column;
  onIssueClick: (issue: Issue) => void;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ column, onIssueClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm border border-slate-200 transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
      }`}
    >
      <div className="sticky top-20 z-30 bg-white px-4 py-3 border-b border-slate-200 rounded-t-lg shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{column.title}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {column.issues.length}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <SortableContext
          items={column.issues.map(issue => issue.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))}
        </SortableContext>
        
        {column.issues.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-sm">No issues</div>
          </div>
        )}
      </div>
    </div>
  );
};