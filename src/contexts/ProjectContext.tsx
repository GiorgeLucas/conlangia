import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ProjectDto,
  listProjects,
  openProject as apiOpenProject,
  createProject as apiCreateProject,
  closeProject as apiCloseProject,
  updateProject as apiUpdateProject,
  removeRecentProject as apiRemoveRecentProject,
  deleteCurrentProject as apiDeleteCurrentProject,
} from "@/api/projects";

interface ProjectContextValue {
  currentProject: ProjectDto | null;
  recentProjects: ProjectDto[];
  isLoading: boolean;
  error: string | null;
  refreshRecentProjects: () => Promise<void>;
  openProject: (path: string) => Promise<void>;
  createProject: (path: string, name: string, description?: string) => Promise<void>;
  updateProject: (
    path: string,
    name: string,
    description: string | null
  ) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  closeProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectDto | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecentProjects = async () => {
    try {
      setError(null);
      const list = await listProjects();
      setRecentProjects(list);
    } catch (err) {
      setError(String(err));
    }
  };

  useEffect(() => {
    refreshRecentProjects();
  }, []);

  const openProject = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const proj = await apiOpenProject(path);
      setCurrentProject(proj);
      await refreshRecentProjects();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (path: string, name: string, description?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const proj = await apiCreateProject(path, name, description ?? null);
      setCurrentProject(proj);
      await refreshRecentProjects();
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (
    path: string,
    name: string,
    description: string | null
  ) => {
    setError(null);
    const updated = await apiUpdateProject(path, name, description);
    setRecentProjects((previous) =>
      previous.map((project) =>
        project.project_dir === updated.project_dir ? updated : project
      )
    );
    setCurrentProject((current) =>
      current?.project_dir === updated.project_dir ? updated : current
    );
  };

  const removeRecentProject = async (path: string) => {
    setError(null);
    await apiRemoveRecentProject(path);
    setRecentProjects((previous) =>
      previous.filter((project) => project.project_dir !== path)
    );
  };

  const deleteCurrentProject = async () => {
    setError(null);
    const projectDir = currentProject?.project_dir;
    await apiDeleteCurrentProject();
    setCurrentProject(null);
    if (projectDir) {
      setRecentProjects((previous) =>
        previous.filter((project) => project.project_dir !== projectDir)
      );
    }
    await refreshRecentProjects();
  };

  const closeProject = async () => {
    try {
      await apiCloseProject();
    } catch (err) {
      console.error("Failed to close project:", err);
    } finally {
      setCurrentProject(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        recentProjects,
        isLoading,
        error,
        refreshRecentProjects,
        openProject,
        createProject,
        updateProject,
        removeRecentProject,
        deleteCurrentProject,
        closeProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
}
