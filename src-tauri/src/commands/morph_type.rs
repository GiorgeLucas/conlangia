use serde::{ser::SerializeStruct, Serialize, Serializer};
use tauri::State;
use thiserror::Error;

use crate::{
    services::{self, morph_type::MorphTypeServiceError},
    state::{self, AppState, StateError},
};

#[derive(Debug, Error)]
pub enum MorphTypeCommandError {
    #[error(transparent)]
    Service(#[from] MorphTypeServiceError),

    #[error(transparent)]
    State(#[from] StateError),
}

impl Serialize for MorphTypeCommandError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            Self::Service(_) => "service",
            Self::State(_) => "state",
        };

        let mut s = serializer.serialize_struct("MorphTypeCommandError", 2)?;
        s.serialize_field("kind", kind)?;
        s.serialize_field("message", &self.to_string())?;
        s.end()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MorphTypeDto {
    pub id: i64,
    pub code: String,
    pub label: String,
    pub is_bound: bool,
}

impl MorphTypeDto {
    fn from_saved(morph_type: &crate::models::morph_type::MorphType) -> Self {
        Self {
            id: morph_type.id().expect("saved morph type has an id").get(),
            code: morph_type.code().as_str().to_string(),
            label: morph_type.label().as_str().to_string(),
            is_bound: morph_type.is_bound(),
        }
    }
}

#[tauri::command]
pub fn create_morph_type(
    state: State<AppState>,
    code: &str,
    label: &str,
    is_bound: bool,
) -> Result<MorphTypeDto, MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let morph_type =
        services::morph_type::create_morph_type(&mut project.connection, code, label, is_bound)?;

    Ok(MorphTypeDto::from_saved(&morph_type))
}

#[tauri::command]
pub fn list_morph_types(
    state: State<AppState>,
) -> Result<Vec<MorphTypeDto>, MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let morph_types = services::morph_type::list_morph_types(&mut project.connection)?
        .iter()
        .map(MorphTypeDto::from_saved)
        .collect();

    Ok(morph_types)
}

#[tauri::command]
pub fn update_morph_type_code(
    state: State<AppState>,
    id: i64,
    code: &str,
) -> Result<MorphTypeDto, MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let morph_type = services::morph_type::update_code(&mut project.connection, id, code)?;

    Ok(MorphTypeDto::from_saved(&morph_type))
}

#[tauri::command]
pub fn update_morph_type_label(
    state: State<AppState>,
    id: i64,
    label: &str,
) -> Result<MorphTypeDto, MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let morph_type = services::morph_type::update_label(&mut project.connection, id, label)?;

    Ok(MorphTypeDto::from_saved(&morph_type))
}

#[tauri::command]
pub fn update_morph_type_bound(
    state: State<AppState>,
    id: i64,
    is_bound: bool,
) -> Result<MorphTypeDto, MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let morph_type = services::morph_type::update_bound(&mut project.connection, id, is_bound)?;

    Ok(MorphTypeDto::from_saved(&morph_type))
}

#[tauri::command]
pub fn delete_morph_type(state: State<AppState>, id: i64) -> Result<(), MorphTypeCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    services::morph_type::delete_morph_type(&mut project.connection, id)?;

    Ok(())
}
