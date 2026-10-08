use std::sync::{Mutex, MutexGuard};

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;
use thiserror::Error;

use crate::models::project::ProjectMetadata;

#[derive(Debug, Serialize, Deserialize, Error)]
pub enum StateError {
    #[error("failed to lock app state")]
    FailedToLockAppState,
}

pub struct CurrentProject {
    pub metadata: ProjectMetadata,
    pub connection: Connection,
}

pub struct AppState {
    pub current_project: Mutex<Option<CurrentProject>>,
    pub app_db: Mutex<Connection>,
}

impl AppState {
    pub fn new(app_db: Connection) -> Self {
        AppState {
            current_project: Mutex::new(None),
            app_db: Mutex::new(app_db),
        }
    }
}

pub fn lock_state_current_project<'a>(
    state: &'a State<'a, AppState>,
) -> Result<MutexGuard<'a, Option<CurrentProject>>, StateError> {
    let guard = state
        .inner()
        .current_project
        .lock()
        .map_err(|_| StateError::FailedToLockAppState)?;

    Ok(guard)
}

pub fn lock_state_app<'a>(
    state: &'a State<'a, AppState>,
) -> Result<MutexGuard<'a, Connection>, StateError> {
    let guard = state
        .inner()
        .app_db
        .lock()
        .map_err(|_| StateError::FailedToLockAppState)?;

    Ok(guard)
}
