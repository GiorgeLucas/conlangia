use std::{ops::DerefMut, path::Path};

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
