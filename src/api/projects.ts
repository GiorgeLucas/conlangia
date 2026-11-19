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
