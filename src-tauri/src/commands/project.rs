use std::{
    ops::DerefMut,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use tauri::State;
use thiserror::Error;

use crate::{
    models::project::ProjectMetadata,
    services,
    state::{self, AppState, CurrentProject, StateError},
};

#[derive(Debug, Serialize, Deserialize, Error)]
#[serde(rename_all = "camelCase")]
pub enum ProjectCommandError {
    #[error("failed to create new project")]
    FailedToCreateNewProject,

    #[error("failed to open project")]
    FailedToOpenProject,

    #[error("failed to list projects")]
    FailedToListProjects,

    #[error("failed to update project")]
    FailedToUpdateProject,

    #[error("failed to remove recent project")]
    FailedToRemoveRecentProject,

    #[error("failed to delete project")]
    FailedToDeleteProject,

    #[error(transparent)]
    StateError(#[from] StateError),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDto {
    pub metadata: Option<ProjectMetadata>,
    pub project_dir: String,
}

#[tauri::command]
pub fn create_project(
    state: State<AppState>,
    path: String,
    name: String,
    description: Option<String>,
) -> Result<ProjectDto, ProjectCommandError> {
    let path = Path::new(&path);

    let mut app_guard = state::lock_state_app(&state)?;

    let (project_dto, connection) = services::project::create_project(
        name.as_str(),
        description.as_deref(),
        path,
        app_guard.deref_mut(),
    )
    .map_err(|_| ProjectCommandError::FailedToCreateNewProject)?;

    drop(app_guard);

    let metadata = project_dto
        .metadata
        .clone()
        .ok_or(ProjectCommandError::FailedToCreateNewProject)?;

    let current_project = CurrentProject {
        metadata,
        project_dir: project_dto.project_dir.clone(),
        connection,
    };

    let mut project_guard = state::lock_state_current_project(&state)?;

    *project_guard = Some(current_project);

    Ok(project_dto)
}

#[tauri::command]
pub fn open_project(
    state: State<AppState>,
    path: String,
) -> Result<ProjectDto, ProjectCommandError> {
    let project_dir = Path::new(&path);

    let mut app_guard = state::lock_state_app(&state)?;

    let (project_dto, connection) =
        services::project::open_project(project_dir, app_guard.deref_mut())
            .map_err(|_| ProjectCommandError::FailedToOpenProject)?;

    drop(app_guard);

    let metadata = project_dto
        .metadata
        .clone()
        .ok_or(ProjectCommandError::FailedToOpenProject)?;

    let current_project = CurrentProject {
        metadata,
        project_dir: project_dto.project_dir.clone(),
        connection,
    };

    let mut project_guard = state::lock_state_current_project(&state)?;

    *project_guard = Some(current_project);

    Ok(project_dto)
}

#[tauri::command]
pub fn close_project(state: State<AppState>) -> Result<(), ProjectCommandError> {
    let mut project_guard = state::lock_state_current_project(&state)?;

    *project_guard = None;

    Ok(())
}

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> Result<Vec<ProjectDto>, ProjectCommandError> {
    let mut project_guard = state::lock_state_app(&state)?;

    let app_db_connection = project_guard.deref_mut();

    let projects = services::project::list_projects(app_db_connection)
        .map_err(|_| ProjectCommandError::FailedToListProjects)?;

    Ok(projects)
}

#[tauri::command]
pub fn update_project(
    state: State<AppState>,
    path: String,
    name: String,
    description: Option<String>,
) -> Result<ProjectDto, ProjectCommandError> {
    let project_dir = Path::new(&path);
    let project_dto = services::project::update_project(project_dir, &name, description.as_deref())
        .map_err(|_| ProjectCommandError::FailedToUpdateProject)?;

    if let Some(metadata) = project_dto.metadata.clone() {
        let mut project_guard = state::lock_state_current_project(&state)?;
        if let Some(current_project) = project_guard.as_mut() {
            if current_project.project_dir == project_dto.project_dir {
                current_project.metadata = metadata;
            }
        }
    }

    Ok(project_dto)
}

#[tauri::command]
pub fn remove_recent_project(
    state: State<AppState>,
    path: String,
) -> Result<(), ProjectCommandError> {
    let mut app_guard = state::lock_state_app(&state)?;
    services::project::remove_recent_project(&path, app_guard.deref_mut())
        .map_err(|_| ProjectCommandError::FailedToRemoveRecentProject)
}

#[tauri::command]
pub fn delete_current_project(state: State<AppState>) -> Result<(), ProjectCommandError> {
    let current_project = {
        let mut project_guard = state::lock_state_current_project(&state)?;
        project_guard.take().ok_or(StateError::ProjectIsNotLoaded)?
    };
    let project_dir = PathBuf::from(&current_project.project_dir);
    let metadata = current_project.metadata.clone();
    drop(current_project);

    let delete_result = match state::lock_state_app(&state) {
        Ok(mut app_guard) => services::project::delete_project(&project_dir, app_guard.deref_mut()),
        Err(error) => {
            restore_current_project(&state, &project_dir, metadata, &error);
            return Err(error.into());
        }
    };

    match delete_result {
        Ok(()) => Ok(()),
        Err(error) => {
            restore_current_project(&state, &project_dir, metadata, &error);
            Err(ProjectCommandError::FailedToDeleteProject)
        }
    }
}

fn restore_current_project(
    state: &State<AppState>,
    project_dir: &Path,
    metadata: ProjectMetadata,
    error: &impl std::fmt::Display,
) {
    match crate::infrastructure::projects::open_project_database(project_dir) {
        Ok(connection) => match state::lock_state_current_project(state) {
            Ok(mut project_guard) => {
                *project_guard = Some(CurrentProject {
                    metadata,
                    project_dir: project_dir.to_string_lossy().to_string(),
                    connection,
                });
            }
            Err(state_error) => {
                eprintln!("Failed to restore current project after deletion error: {state_error}");
            }
        },
        Err(reopen_error) => {
            eprintln!(
                "Failed to restore current project after deletion error ({error}): {reopen_error}"
            );
        }
    }
}
