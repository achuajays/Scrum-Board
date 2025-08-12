import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { supabase, Issue, Column } from '../lib/supabase';
import { BoardColumn } from './BoardColumn';
import { IssueCard } from './IssueCard';
import { IssueModal } from './IssueModal';
import { AddIssueModal } from './AddIssueModal';
import { WorkflowModal } from './WorkflowModal';
import { ProjectInfoModal } from './ProjectInfoModal';

export const ScrumBoard: React.FC = () => {
  const [workflowColumns, setWorkflowColumns] = useState<{ id: string; title: string }[]>([
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'dev', title: 'Dev' },
    { id: 'uat', title: 'UAT' },
    { id: 'done', title: 'Done' },
  ]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isProjectInfoModalOpen, setIsProjectInfoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadIssues();
  }, [workflowColumns]);

  const loadIssues = async () => {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .order('position');

      if (error) throw error;

      const columnsData = workflowColumns.map(column => ({
        ...column,
        issues: issues
          ?.filter(issue => issue.status === column.id)
          .sort((a, b) => a.position - b.position) || [],
      }));

      setColumns(columnsData);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = findIssue(active.id as string);
    setActiveIssue(issue);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active issue and its current column
    const activeIssue = findIssue(activeId);
    if (!activeIssue) return;

    const activeColumn = findColumnContainingIssue(activeId);
    if (!activeColumn) return;

    // Determine target column and position
    let targetColumn: Column;
    let targetPosition: number;

    // Check if dropping on a column header
    const directColumn = workflowColumns.find(col => col.id === overId);
    if (directColumn) {
      targetColumn = columns.find(col => col.id === overId)!;
      targetPosition = targetColumn.issues.length;
    } else {
      // Dropping on another issue
      const targetIssue = findIssue(overId);
      if (!targetIssue) return;
      
      targetColumn = findColumnContainingIssue(overId)!;
      targetPosition = targetColumn.issues.findIndex(issue => issue.id === overId);
    }

    // If same position, do nothing
    if (activeColumn.id === targetColumn.id && 
        activeColumn.issues.findIndex(issue => issue.id === activeId) === targetPosition) {
      return;
    }

    try {
      if (activeColumn.id === targetColumn.id) {
        // Same column - reorder
        const activeIndex = activeColumn.issues.findIndex(issue => issue.id === activeId);
        const newOrder = arrayMove(activeColumn.issues, activeIndex, targetPosition);
        
        // Update positions in database
        const updates = newOrder.map((issue, index) => 
          supabase
            .from('issues')
            .update({ 
              position: index,
              updated_at: new Date().toISOString()
            })
            .eq('id', issue.id)
        );
        
        await Promise.all(updates);
      } else {
        // Different column - move issue
        await supabase
          .from('issues')
          .update({ 
            status: targetColumn.id as Issue['status'],
            position: targetPosition,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeId);

        // Update positions in target column
        const targetIssues = targetColumn.issues;
        for (let i = targetPosition; i < targetIssues.length; i++) {
          await supabase
            .from('issues')
            .update({ 
              position: i + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', targetIssues[i].id);
        }

        // Update positions in source column
        const sourceIssues = activeColumn.issues;
        const activeIndex = sourceIssues.findIndex(issue => issue.id === activeId);
        for (let i = activeIndex + 1; i < sourceIssues.length; i++) {
          await supabase
            .from('issues')
            .update({ 
              position: i - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', sourceIssues[i].id);
        }
      }

      // Reload data to ensure consistency
      await loadIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
      // Reload on error to reset state
      await loadIssues();
    }
  };

  const findIssue = (issueId: string): Issue | null => {
    for (const column of columns) {
      const issue = column.issues.find(issue => issue.id === issueId);
      if (issue) return issue;
    }
    return null;
  };

  const findColumnContainingIssue = (issueId: string): Column | null => {
    for (const column of columns) {
      if (column.issues.find(issue => issue.id === issueId)) {
        return column;
      }
    }
    return null;
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleIssueUpdate = async (updatedIssue: Issue) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          title: updatedIssue.title,
          description: updatedIssue.description,
          priority: updatedIssue.priority,
          status: updatedIssue.status,
          assignee_name: updatedIssue.assignee_name,
          story_points: updatedIssue.story_points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedIssue.id);

      if (error) throw error;
      await loadIssues();
      setSelectedIssue(null);
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleIssueDelete = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', issueId);

      if (error) throw error;
      await loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error;
    }
  };

  const handleAddIssue = async (newIssue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'position'>) => {
    try {
      const targetColumn = columns.find(col => col.id === newIssue.status);
      const position = targetColumn ? targetColumn.issues.length : 0;

      const { error } = await supabase
        .from('issues')
        .insert([{
          ...newIssue,
          position,
        }]);

      if (error) throw error;
      await loadIssues();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding issue:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">McMillan</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsWorkflowModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              >
                Manage Workflow
              </button>
              <button
                onClick={() => setIsProjectInfoModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              >
                Project Information
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[calc(100vh-140px)]">
            {columns.map(column => (
              <BoardColumn
                key={column.id}
                column={column}
                onIssueClick={handleIssueClick}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeIssue ? (
              <div className="rotate-2 transform-gpu">
                <IssueCard issue={activeIssue} onClick={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          workflowColumns={workflowColumns}
          onClose={() => setSelectedIssue(null)}
          onUpdate={handleIssueUpdate}
          onDelete={handleIssueDelete}
        />
      )}

      {isAddModalOpen && (
        <AddIssueModal
          workflowColumns={workflowColumns}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddIssue}
        />
      )}

      {isWorkflowModalOpen && (
        <WorkflowModal
          columns={workflowColumns}
          onClose={() => setIsWorkflowModalOpen(false)}
          onUpdate={(newColumns) => {
            setWorkflowColumns(newColumns);
            loadIssues();
          }}
        />
      )}

      {isProjectInfoModalOpen && (
        <ProjectInfoModal
          onClose={() => setIsProjectInfoModalOpen(false)}
        />
      )}
    </div>
  );
};