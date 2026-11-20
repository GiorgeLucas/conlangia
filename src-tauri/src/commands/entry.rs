use serde::Serialize;
use serde::{ser::SerializeStruct, Serializer};
use tauri::State;
use thiserror::Error;

use crate::models::category::CategoryId;
use crate::models::entry::Entry;
use crate::models::morph_type::MorphTypeId;
use crate::{
    services::{self, entry::EntryServiceError},
    state::{self, AppState, StateError},
};

#[derive(Debug, Error)]
pub enum EntryCommandError {
    #[error(transparent)]
    Service(#[from] EntryServiceError),

    #[error(transparent)]
    State(#[from] StateError),
}
impl Serialize for EntryCommandError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            Self::Service(_) => "service",
            Self::State(_) => "state",
        };

        let mut s = serializer.serialize_struct("EntryCommandError", 2)?;
        s.serialize_field("kind", kind)?;
        s.serialize_field("message", &self.to_string())?;
        s.end()
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SenseDto {
    pub id: i64,
    pub translation: String,
    pub definition: Option<String>,
    pub sort_order: i64,
    pub category_id: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PronunciationDto {
    pub id: i64,
    pub value: String,
    pub description: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryDto {
    pub id: i64,
    pub entry_form: String,
    pub morph_type_id: Option<i64>,
    pub pronunciations: Vec<PronunciationDto>,
    pub senses: Vec<SenseDto>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryListRowDto {
    pub id: i64,
    pub entry_form: String,
    pub primary_pronunciation: Option<String>,
    pub translations: Vec<String>,
    pub morph_type_id: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryListDto {
    pub rows: Vec<EntryListRowDto>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkCreateEntriesDto {
    pub created_entries: Vec<EntryDto>,
    pub skipped_count: usize,
}

impl EntryDto {
    fn from_saved(entry: &Entry) -> Self {
        Self {
            id: entry.id().expect("saved entry has an id").get(),
            entry_form: entry.form().as_str().to_string(),
            morph_type_id: entry.morph_type_id().map(MorphTypeId::get),
            pronunciations: entry
                .pronunciations()
                .iter()
                .map(|p| PronunciationDto {
                    id: p.id().expect("saved pronunciation has an id").get(),
                    value: p.value().as_str().to_string(),
                    description: p.description().as_deref().map(str::to_string),
                    sort_order: p.sort_order().get(),
                })
                .collect(),
            senses: entry
                .senses()
                .iter()
                .map(|s| SenseDto {
                    id: s.id().expect("saved sense has an id").get(),
                    translation: s.translation().as_str().to_string(),
                    definition: s.definition().as_deref().map(str::to_string),
                    sort_order: s.sort_order().get(),
                    category_id: s.category_id().map(CategoryId::get),
                })
                .collect(),
        }
    }
}

#[tauri::command]
pub fn create_entry(
    state: State<AppState>,
    entry_form: &str,
    morph_type_id: Option<i64>,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::create_entry(&mut project.connection, entry_form, morph_type_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn create_entries(
    state: State<AppState>,
    entry_forms: Vec<String>,
) -> Result<BulkCreateEntriesDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let result = services::entry::create_entries(&mut project.connection, &entry_forms)?;

    Ok(BulkCreateEntriesDto {
        created_entries: result
            .created_entries
            .iter()
            .map(EntryDto::from_saved)
            .collect(),
        skipped_count: result.skipped_count,
    })
}

#[tauri::command]
pub fn list_entries(state: State<AppState>) -> Result<EntryListDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entries = services::entry::list_entries(&mut project.connection)?;

    let rows = entries
        .into_iter()
        .map(|entry| EntryListRowDto {
            id: entry.id().expect("saved entry has an id").get(),
            entry_form: entry.form().as_str().to_string(),
            primary_pronunciation: entry
                .pronunciations()
                .first()
                .map(|p| p.value().as_str().to_string()),
            translations: entry
                .senses()
                .iter()
                .map(|s| s.translation().as_str().to_string())
                .collect(),
            morph_type_id: entry.morph_type_id().map(MorphTypeId::get),
        })
        .collect();

    Ok(EntryListDto { rows })
}

#[tauri::command]
pub fn get_entry(
    state: State<AppState>,
    entry_id: i64,
) -> Result<Option<EntryDto>, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::get_entry(&mut project.connection, entry_id)?;

    Ok(entry.as_ref().map(EntryDto::from_saved))
}

#[tauri::command]
pub fn delete_entry(state: State<AppState>, entry_id: i64) -> Result<(), EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    services::entry::delete_entry(&mut project.connection, entry_id)?;

    Ok(())
}

#[tauri::command]
pub fn delete_entries(
    state: State<AppState>,
    entry_ids: Vec<i64>,
) -> Result<Vec<i64>, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    Ok(services::entry::delete_entries(
        &mut project.connection,
        &entry_ids,
    )?)
}

#[tauri::command]
pub fn update_entry_form(
    state: State<AppState>,
    entry_id: i64,
    entry_form: &str,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::update_form(&mut project.connection, entry_id, entry_form)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_morph_type(
    state: State<AppState>,
    entry_id: i64,
    morph_type_id: Option<i64>,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry =
        services::entry::update_morph_type(&mut project.connection, entry_id, morph_type_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entries_morph_type(
    state: State<AppState>,
    entry_ids: Vec<i64>,
    morph_type_id: Option<i64>,
) -> Result<Vec<EntryDto>, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entries = services::entry::update_morph_type_for_many(
        &mut project.connection,
        &entry_ids,
        morph_type_id,
    )?;

    Ok(entries.iter().map(EntryDto::from_saved).collect())
}

#[tauri::command]
pub fn add_entry_pronunciation(
    state: State<AppState>,
    value: &str,
    description: Option<&str>,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry =
        services::entry::add_pronunciation(&mut project.connection, value, description, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_pronunciation_value(
    state: State<AppState>,
    id: i64,
    value: &str,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry =
        services::entry::update_pronunciation_value(&mut project.connection, id, value, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_pronunciation_description(
    state: State<AppState>,
    id: i64,
    description: Option<&str>,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::update_pronunciation_description(
        &mut project.connection,
        id,
        description,
        entry_id,
    )?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn move_entry_pronunciation(
    state: State<AppState>,
    id: i64,
    new_position: i64,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry =
        services::entry::move_pronunciation(&mut project.connection, id, new_position, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn remove_entry_pronunciation(
    state: State<AppState>,
    id: i64,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::remove_pronunciation(&mut project.connection, id, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn add_entry_sense(
    state: State<AppState>,
    translation: &str,
    definition: Option<&str>,
    category_id: Option<i64>,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::add_sense(
        &mut project.connection,
        translation,
        definition,
        category_id,
        entry_id,
    )?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_sense_translation(
    state: State<AppState>,
    id: i64,
    translation: &str,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::update_sense_translation(
        &mut project.connection,
        id,
        translation,
        entry_id,
    )?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_sense_definition(
    state: State<AppState>,
    id: i64,
    definition: Option<&str>,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::update_sense_definition(
        &mut project.connection,
        id,
        definition,
        entry_id,
    )?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn update_entry_sense_category(
    state: State<AppState>,
    id: i64,
    category_id: Option<i64>,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry =
        services::entry::update_sense_category(&mut project.connection, id, category_id, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn move_entry_sense(
    state: State<AppState>,
    id: i64,
    new_position: i64,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::move_sense(&mut project.connection, id, new_position, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}

#[tauri::command]
pub fn remove_entry_sense(
    state: State<AppState>,
    id: i64,
    entry_id: i64,
) -> Result<EntryDto, EntryCommandError> {
    let mut guard = state::lock_state_current_project(&state)?;
    let project = guard.as_mut().ok_or(StateError::ProjectIsNotLoaded)?;

    let entry = services::entry::remove_sense(&mut project.connection, id, entry_id)?;

    Ok(EntryDto::from_saved(&entry))
}
