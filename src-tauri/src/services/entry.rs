use rusqlite::Connection;
use thiserror::Error;

use crate::{
    infrastructure::{
        database::{projects::repositories::entry::EntryRepository, DatabaseError},
        InfrastructureError,
    },
    models::{
        category::CategoryId,
        entry::{
            pronunciation::{
                PronunciationDescription, PronunciationError, PronunciationId,
                PronunciationSortOrder, PronunciationValue,
            },
            sense::{SenseDefinition, SenseError, SenseId, SenseSortOrder, SenseTranslation},
            Entry, EntryError, EntryForm, EntryId,
        },
        morph_type::MorphTypeId,
    },
};

#[derive(Debug, Error)]
pub enum EntryServiceError {
    #[error(transparent)]
    Infrastructure(#[from] InfrastructureError),

    #[error(transparent)]
    Database(#[from] DatabaseError),

    #[error(transparent)]
    Model(#[from] EntryError),
}

pub fn create_entry(
    project_conn: &mut Connection,
    entry_form: &str,
    morph_type_id: Option<i64>,
) -> Result<Entry, EntryServiceError> {
    let entry_form = EntryForm::new(entry_form)?;

    let mut new_entry = Entry::new(entry_form);

    if let Some(id) = morph_type_id {
        let morph_type_id = MorphTypeId::new(id);
        new_entry.set_morph_type_id(Some(morph_type_id));
    }

    let mut repo = EntryRepository::new(project_conn);

    Ok(repo.save(&new_entry)?)
}

pub fn list_entries(project_conn: &mut Connection) -> Result<Vec<Entry>, EntryServiceError> {
    let repo = EntryRepository::new(project_conn);

    Ok(repo.list()?)
}

pub fn update_form(
    project_conn: &mut Connection,
    entry_id: i64,
    entry_form: &str,
) -> Result<Entry, EntryServiceError> {
    let entry_id = EntryId::new(entry_id);

    let new_form = EntryForm::new(entry_form)?;

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.set_entry_form(new_form);

    Ok(repo.save(&entry)?)
}

pub fn update_morph_type(
    project_conn: &mut Connection,
    entry_id: i64,
    morph_type_id: Option<i64>,
) -> Result<Entry, EntryServiceError> {
    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    let morph_type_id = morph_type_id.map(MorphTypeId::new);

    entry.set_morph_type_id(morph_type_id);

    Ok(repo.save(&entry)?)
}

pub fn add_pronunciation(
    project_conn: &mut Connection,
    value: &str,
    description: Option<&str>,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let value = PronunciationValue::new(value).map_err(|_| {
        EntryServiceError::Model(EntryError::PronunciationError(
            PronunciationError::ValueIsEmpty,
        ))
    })?;

    let description = PronunciationDescription::new(description);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.add_pronunciation(value, description);

    Ok(repo.save(&entry)?)
}

pub fn update_pronunciation_value(
    project_conn: &mut Connection,
    pronunciation_id: i64,
    value: &str,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = PronunciationId::new(pronunciation_id);

    let value = PronunciationValue::new(value).map_err(|_| {
        EntryServiceError::Model(EntryError::PronunciationError(
            PronunciationError::ValueIsEmpty,
        ))
    })?;

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.update_pronunciation_value(id, value)?;

    Ok(repo.save(&entry)?)
}

pub fn update_pronunciation_description(
    project_conn: &mut Connection,
    pronunciation_id: i64,
    description: Option<&str>,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = PronunciationId::new(pronunciation_id);

    let description = PronunciationDescription::new(description);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.update_pronunciation_description(id, description)?;

    Ok(repo.save(&entry)?)
}

pub fn move_pronunciation(
    project_conn: &mut Connection,
    pronunciation_id: i64,
    new_position: i64,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = PronunciationId::new(pronunciation_id);
    let to = PronunciationSortOrder::new(new_position).map_err(EntryError::from)?;
    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.move_pronunciation(id, to)?;

    Ok(repo.save(&entry)?)
}

pub fn remove_pronunciation(
    project_conn: &mut Connection,
    pronunciation_id: i64,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let entry_id = EntryId::new(entry_id);
    let pronunciation_id = PronunciationId::new(pronunciation_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.remove_pronunciation(pronunciation_id)?;

    Ok(repo.save(&entry)?)
}

pub fn add_sense(
    project_conn: &mut Connection,
    translation: &str,
    definition: Option<&str>,
    category_id: Option<i64>,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let translation = SenseTranslation::new(translation).map_err(|_| {
        EntryServiceError::Model(EntryError::SenseError(SenseError::TranslationIsEmpty))
    })?;

    let definition = SenseDefinition::new(definition);

    let category_id = category_id.map(CategoryId::new);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.add_sense(translation, definition, category_id);

    Ok(repo.save(&entry)?)
}

pub fn update_sense_translation(
    project_conn: &mut Connection,
    sense_id: i64,
    translation: &str,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = SenseId::new(sense_id);

    let translation = SenseTranslation::new(translation).map_err(|_| {
        EntryServiceError::Model(EntryError::SenseError(SenseError::TranslationIsEmpty))
    })?;

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.update_sense_translation(id, translation)?;

    Ok(repo.save(&entry)?)
}

pub fn update_sense_definition(
    project_conn: &mut Connection,
    sense_id: i64,
    definition: Option<&str>,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = SenseId::new(sense_id);

    let definition = SenseDefinition::new(definition);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.update_sense_definition(id, definition)?;

    Ok(repo.save(&entry)?)
}

pub fn update_sense_category(
    project_conn: &mut Connection,
    sense_id: i64,
    category_id: Option<i64>,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = SenseId::new(sense_id);

    let category_id = category_id.map(CategoryId::new);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.update_sense_category(id, category_id)?;

    Ok(repo.save(&entry)?)
}

pub fn move_sense(
    project_conn: &mut Connection,
    sense_id: i64,
    new_position: i64,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = SenseId::new(sense_id);
    let to = SenseSortOrder::new(new_position).map_err(EntryError::from)?;
    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.move_sense(id, to)?;

    Ok(repo.save(&entry)?)
}

pub fn remove_sense(
    project_conn: &mut Connection,
    sense_id: i64,
    entry_id: i64,
) -> Result<Entry, EntryServiceError> {
    let id = SenseId::new(sense_id);

    let entry_id = EntryId::new(entry_id);

    let mut repo = EntryRepository::new(project_conn);

    let mut entry = repo.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)?;

    entry.remove_sense(id)?;

    Ok(repo.save(&entry)?)
}

#[cfg(test)]
mod tests {
    use crate::infrastructure;

    use super::*;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        infrastructure::database::projects::run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn create_entry_returns_entry_with_form() {
        let mut conn = setup();

        let entry = create_entry(&mut conn, "casa", None).unwrap();

        assert_eq!(entry.form().as_str(), "casa");
        assert!(entry.id().is_some());
    }

    #[test]
    fn create_entry_rejects_invalid_form() {
        let mut conn = setup();

        let err = create_entry(&mut conn, "", None).unwrap_err();

        assert!(matches!(err, EntryServiceError::Model(_)));
    }

    #[test]
    fn update_form_updates_existing_entry() {
        let mut conn = setup();

        let created = create_entry(&mut conn, "casa", None).unwrap();

        let updated = update_form(&mut conn, created.id().unwrap().get(), "casa nova").unwrap();

        assert_eq!(updated.form().as_str(), "casa nova");
        assert_eq!(updated.id(), created.id());
    }

    #[test]
    fn update_form_returns_not_found_for_missing_entry() {
        let mut conn = setup();

        let err = update_form(&mut conn, 999_999, "nova").unwrap_err();

        assert!(matches!(
            err,
            EntryServiceError::Database(DatabaseError::NotFound)
        ));
    }

    #[test]
    fn add_pronunciation_returns_updated_entry() {
        let mut conn = setup();

        let created = create_entry(&mut conn, "casa", None).unwrap();

        let updated = add_pronunciation(
            &mut conn,
            "ka-sa",
            Some("pronúncia"),
            created.id().unwrap().get(),
        )
        .unwrap();

        assert_eq!(updated.pronunciations().len(), 1);
        assert_eq!(updated.pronunciations()[0].value().as_str(), "ka-sa");
    }

    #[test]
    fn add_pronunciation_rejects_invalid_value() {
        let mut conn = setup();

        let created = create_entry(&mut conn, "casa", None).unwrap();

        let err = add_pronunciation(&mut conn, "", Some("desc"), created.id().unwrap().get())
            .unwrap_err();

        assert!(matches!(err, EntryServiceError::Model(_)));
    }
}
