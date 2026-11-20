import { invoke } from '@tauri-apps/api/core';

export interface ProjectMetadata {
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProjectDto {
  metadata: ProjectMetadata | null;
  project_dir: string;
}

export type projectDto = ProjectDto;

export function createProject(
  path: string,
  name: string,
  description: string | null = null
): Promise<ProjectDto> {
  return invoke<ProjectDto>('create_project', {
    path,
    name,
    description,
  });
}

export function listProjects(): Promise<ProjectDto[]> {
  return invoke<ProjectDto[]>('list_projects');
}

export function openProject(path: string): Promise<ProjectDto> {
  return invoke<ProjectDto>('open_project', { path });
}

export function closeProject(): Promise<void> {
  return invoke<void>('close_project');
}

export function updateProject(
  path: string,
  name: string,
  description: string | null
): Promise<ProjectDto> {
  return invoke<ProjectDto>('update_project', {
    path,
    name,
    description,
  });
}

export function removeRecentProject(path: string): Promise<void> {
  return invoke<void>('remove_recent_project', { path });
}

export function deleteCurrentProject(): Promise<void> {
  return invoke<void>('delete_current_project');
}
