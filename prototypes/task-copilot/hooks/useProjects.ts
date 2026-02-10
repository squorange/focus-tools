/**
 * useProjects.ts
 *
 * Hook for project CRUD operations and modal state.
 * Manages project creation, update, deletion, and the project modal.
 *
 * Usage:
 * const projects = useProjects(state, setState, { showToast });
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { AppState, Project, createProject } from '@/lib/types';
import { ToastData } from '@design-system/components';

export interface UseProjectsOptions {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
}

export function useProjects(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  options: UseProjectsOptions
) {
  const { showToast } = options;

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [pendingProjectCallback, setPendingProjectCallback] = useState<((projectId: string) => void) | null>(null);

  const handleCreateProject = useCallback((name: string, color: string | null) => {
    const newProject = createProject(name, color ?? undefined);
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    setProjectModalOpen(false);
    setEditingProject(null);

    // Call pending callback to auto-select the new project (from TaskCreationPopover)
    if (pendingProjectCallback) {
      pendingProjectCallback(newProject.id);
      setPendingProjectCallback(null);
    }
  }, [setState, pendingProjectCallback]);

  const handleUpdateProject = useCallback((projectId: string, name: string, color: string | null) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, name, color, updatedAt: Date.now() }
          : p
      ),
    }));
    setProjectModalOpen(false);
    setEditingProject(null);
  }, [setState]);

  const handleDeleteProject = useCallback((projectId: string) => {
    // Capture project and affected tasks for undo
    let deletedProject: Project | undefined;
    let affectedTaskIds: string[] = [];

    setState((prev) => {
      deletedProject = prev.projects.find((p) => p.id === projectId);
      affectedTaskIds = prev.tasks
        .filter((t) => t.projectId === projectId)
        .map((t) => t.id);

      return {
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        // Also remove project from tasks that reference it
        tasks: prev.tasks.map((t) =>
          t.projectId === projectId
            ? { ...t, projectId: null, updatedAt: Date.now() }
            : t
        ),
      };
    });

    // Show toast with undo action
    if (deletedProject) {
      const projectName = deletedProject.name;
      const taskCount = affectedTaskIds.length;
      showToast({
        message: `"${projectName}" deleted${taskCount > 0 ? ` (${taskCount} task${taskCount > 1 ? 's' : ''} released)` : ''}`,
        type: 'info',
        action: {
          label: 'Undo',
          onClick: () => {
            // Restore project and re-assign tasks
            setState((prev) => ({
              ...prev,
              projects: [...prev.projects, deletedProject!],
              tasks: prev.tasks.map((t) =>
                affectedTaskIds.includes(t.id)
                  ? { ...t, projectId: projectId, updatedAt: Date.now() }
                  : t
              ),
            }));
          },
        },
      });
    }

    setProjectModalOpen(false);
    setEditingProject(null);
  }, [setState, showToast]);

  const handleOpenProjectModal = useCallback((project?: Project) => {
    setEditingProject(project || null);
    setProjectModalOpen(true);
  }, []);

  // Callback version for auto-selecting new project (used by TaskCreationPopover)
  const handleOpenProjectModalWithCallback = useCallback((callback: (projectId: string) => void) => {
    setPendingProjectCallback(() => callback);
    setEditingProject(null);
    setProjectModalOpen(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setProjectModalOpen(false);
    setEditingProject(null);
    setPendingProjectCallback(null);
  }, []);

  return {
    projectModalOpen,
    editingProject,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    openProjectModal: handleOpenProjectModal,
    openProjectModalWithCallback: handleOpenProjectModalWithCallback,
    closeProjectModal: handleCloseProjectModal,
  };
}

export default useProjects;
