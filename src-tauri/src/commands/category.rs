use serde::{ser::SerializeStruct, Serialize, Serializer};
use tauri::State;
use thiserror::Error;

use crate::{
    models::category::Category,
    services::{self, category::CategoryServiceError},
    state::{self, AppState, StateError},
};

#[derive(Debug, Error)]
pub enum CategoryCommandError {
    #[error(transparent)]
    Service(#[from] CategoryServiceError),

    #[error(transparent)]
    State(#[from] StateError),
}
impl Serialize for CategoryCommandError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            Self::Service(_) => "service",
            Self::State(_) => "state",
        };

        let mut s = serializer.serialize_struct("CategoryCommandError", 2)?;
        s.serialize_field("kind", kind)?;
        s.serialize_field("message", &self.to_string())?;
        s.end()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDto {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
}
impl CategoryDto {
    fn from_saved(category: &Category) -> Self {
        Self {
            id: category.id().expect("saved entry has an id").get(),
            name: category.name().as_str().to_string(),
            description: category.description().as_deref().map(str::to_string),
        }
    }
}

#[tauri::command]
pub fn create_category(
    state: State<AppState>,
    name: &str,
    description: Option<&str>,
) -> Result<CategoryDto, CategoryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let category = services::category::create_category(&mut project.connection, name, description)?;

    Ok(CategoryDto::from_saved(&category))
}

#[tauri::command]
pub fn list_categories(state: State<AppState>) -> Result<Vec<CategoryDto>, CategoryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let categories = services::category::list_categories(&mut project.connection)?
        .iter()
        .map(CategoryDto::from_saved)
        .collect();

    Ok(categories)
}

#[tauri::command]
pub fn update_category_name(
    state: State<AppState>,
    id: i64,
    name: &str,
) -> Result<CategoryDto, CategoryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let category = services::category::update_name(&mut project.connection, id, name)?;

    Ok(CategoryDto::from_saved(&category))
}

#[tauri::command]
pub fn update_category_description(
    state: State<AppState>,
    id: i64,
    description: Option<&str>,
) -> Result<CategoryDto, CategoryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let category =
        services::category::update_description(&mut project.connection, id, description)?;

    Ok(CategoryDto::from_saved(&category))
}

#[tauri::command]
pub fn delete_category(
    state: State<AppState>,
    id: i64,
) -> Result<(), CategoryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    services::category::delete_category(&mut project.connection, id)?;

    Ok(())
}
