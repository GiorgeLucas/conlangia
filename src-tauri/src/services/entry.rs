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
    new_form: &str,
) -> Result<Entry, EntryServiceError> {
    let entry_id = EntryId::new(entry_id);

    let new_form = EntryForm::new(new_form)?;

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

    fn morph_type(conn: &mut Connection, code: &str, label: &str) -> MorphTypeId {
        conn.execute(
            "INSERT INTO morph_types (code, label, is_bound) VALUES (?1, ?2, ?3)",
            (code, label, false),
        )
        .unwrap();
        let id = conn.last_insert_rowid();
        MorphTypeId::new(id)
    }

    fn category(conn: &mut Connection, name: &str, description: Option<&str>) -> CategoryId {
        conn.execute(
            "INSERT INTO categories (name, description) VALUES (?1, ?2)",
            (name, description),
        )
        .unwrap();

        let id = conn.last_insert_rowid();
        CategoryId::new(id)
    }

    mod create_entry {
        use super::*;

        #[test]
        fn returns_entry_with_correct_data() {
            let entry_form = "test";

            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, entry_form, None).unwrap();

            assert_eq!(entry.form().as_str(), entry_form);
        }

        #[test]
        fn saves_entry_in_database() {
            let entry_form = "test";

            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, entry_form, None).unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo.find_by_id(entry.id().unwrap()).unwrap().unwrap();

            assert_eq!(saved_entry.form().as_str(), entry_form);
        }
    }

    mod list_entries {
        use super::*;

        #[test]
        fn returns_all_entries() {
            let mut project_conn = setup();

            let entry1 = create_entry(&mut project_conn, "entry1", None).unwrap();
            let entry2 = create_entry(&mut project_conn, "entry2", None).unwrap();

            let entries = list_entries(&mut project_conn).unwrap();

            assert_eq!(entries.len(), 2);
            assert!(entries.iter().any(|e| e.id() == entry1.id()));
            assert!(entries.iter().any(|e| e.id() == entry2.id()));
        }
    }

    mod update_form {
        use super::*;

        #[test]
        fn returns_entry_with_updated_form() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "old form", None).unwrap();

            let updated_entry =
                update_form(&mut project_conn, entry.id().unwrap().get(), "new form").unwrap();

            assert_eq!(updated_entry.form().as_str(), "new form");
        }

        #[test]
        fn updates_entry_form_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "old form", None).unwrap();

            let updated_entry =
                update_form(&mut project_conn, entry.id().unwrap().get(), "new form").unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(saved_entry.form().as_str(), "new form");
        }
    }

    mod update_morph_type {
        use super::*;

        #[test]
        fn returns_entry_with_updated_morph_type() {
            let mut project_conn = setup();

            let root_morph_id = morph_type(&mut project_conn, "rt", "Root");

            let suffix_morph_id = morph_type(&mut project_conn, "sfx", "suffix");

            let entry =
                create_entry(&mut project_conn, "entry", Some(root_morph_id.get())).unwrap();

            let updated_entry = update_morph_type(
                &mut project_conn,
                entry.id().unwrap().get(),
                Some(suffix_morph_id.get()),
            )
            .unwrap();

            assert_eq!(
                updated_entry.morph_type_id().map(|id| id.get()),
                Some(suffix_morph_id.get())
            );
        }

        #[test]
        fn updates_entry_morph_type_in_database() {
            let mut project_conn = setup();

            let root_morph_id = morph_type(&mut project_conn, "rt", "Root");

            let suffix_morph_id = morph_type(&mut project_conn, "sfx", "suffix");

            let entry =
                create_entry(&mut project_conn, "entry", Some(root_morph_id.get())).unwrap();

            let updated_entry = update_morph_type(
                &mut project_conn,
                entry.id().unwrap().get(),
                Some(suffix_morph_id.get()),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.morph_type_id().map(|id| id.get()),
                Some(suffix_morph_id.get())
            );
        }
    }

    mod add_pronunciation {
        use super::*;

        #[test]
        fn returns_entry_with_new_pronunciation() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(updated_entry.pronunciations().len(), 1);
            assert_eq!(
                updated_entry.pronunciations()[0].value().as_str(),
                "pronunciation"
            );
            assert_eq!(
                updated_entry.pronunciations()[0].description().as_deref(),
                Some("description")
            );
        }

        #[test]
        fn saves_pronunciation_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(saved_entry.pronunciations().len(), 1);
            assert_eq!(
                saved_entry.pronunciations()[0].value().as_str(),
                "pronunciation"
            );
            assert_eq!(
                saved_entry.pronunciations()[0].description().as_deref(),
                Some("description")
            );
        }
    }

    mod update_pronunciation_value {
        use super::*;

        #[test]
        fn returns_entry_with_updated_pronunciation_value() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "old pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = update_pronunciation_value(
                &mut project_conn,
                pronunciation_id,
                "new pronunciation",
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.pronunciations()[0].value().as_str(),
                "new pronunciation"
            );
        }

        #[test]
        fn updates_pronunciation_value_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "old pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = update_pronunciation_value(
                &mut project_conn,
                pronunciation_id,
                "new pronunciation",
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.pronunciations()[0].value().as_str(),
                "new pronunciation"
            );
        }
    }

    mod update_pronunciation_description {
        use super::*;

        #[test]
        fn returns_entry_with_updated_pronunciation_description() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("old description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = update_pronunciation_description(
                &mut project_conn,
                pronunciation_id,
                Some("new description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.pronunciations()[0].description().as_deref(),
                Some("new description")
            );
        }

        #[test]
        fn updates_pronunciation_description_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("old description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = update_pronunciation_description(
                &mut project_conn,
                pronunciation_id,
                Some("new description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.pronunciations()[0].description().as_deref(),
                Some("new description")
            );
        }
    }

    mod move_pronunciation {
        use super::*;

        #[test]
        fn returns_entry_with_reordered_pronunciations() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation 1",
                Some("description 1"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation 2",
                Some("description 2"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = move_pronunciation(
                &mut project_conn,
                pronunciation_id,
                2,
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.pronunciations()[0].value().as_str(),
                "pronunciation 2"
            );
            assert_eq!(
                updated_entry.pronunciations()[1].value().as_str(),
                "pronunciation 1"
            );
        }

        #[test]
        fn reorders_pronunciations_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation 1",
                Some("description 1"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation 2",
                Some("description 2"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = move_pronunciation(
                &mut project_conn,
                pronunciation_id,
                2,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();
            assert_eq!(
                saved_entry.pronunciations()[0].value().as_str(),
                "pronunciation 2"
            );
            assert_eq!(
                saved_entry.pronunciations()[1].value().as_str(),
                "pronunciation 1"
            );
        }
    }

    mod remove_pronunciation {
        use super::*;

        #[test]
        fn returns_entry_without_pronunciation() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = remove_pronunciation(
                &mut project_conn,
                pronunciation_id,
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(updated_entry.pronunciations().len(), 0);
        }

        #[test]
        fn removes_pronunciation_from_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_pronunciation(
                &mut project_conn,
                "pronunciation",
                Some("description"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let pronunciation_id = updated_entry.pronunciations()[0].id().unwrap().get();

            let updated_entry = remove_pronunciation(
                &mut project_conn,
                pronunciation_id,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(saved_entry.pronunciations().len(), 0);
        }
    }

    mod add_sense {
        use super::*;

        #[test]
        fn returns_entry_with_new_sense() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(updated_entry.senses().len(), 1);
            assert_eq!(
                updated_entry.senses()[0].translation().as_str(),
                "translation"
            );
            assert_eq!(
                updated_entry.senses()[0].definition().as_deref(),
                Some("definition")
            );
        }

        #[test]
        fn saves_sense_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(saved_entry.senses().len(), 1);
            assert_eq!(
                saved_entry.senses()[0].translation().as_str(),
                "translation"
            );
            assert_eq!(
                saved_entry.senses()[0].definition().as_deref(),
                Some("definition")
            );
        }
    }

    mod update_sense_translation {
        use super::*;

        #[test]
        fn returns_entry_with_updated_sense_translation() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_translation(
                &mut project_conn,
                sense_id,
                "new translation",
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.senses()[0].translation().as_str(),
                "new translation"
            );
        }

        #[test]
        fn updates_sense_translation_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_translation(
                &mut project_conn,
                sense_id,
                "new translation",
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.senses()[0].translation().as_str(),
                "new translation"
            );
        }
    }

    mod update_sense_definition {
        use super::*;

        #[test]
        fn returns_entry_with_updated_sense_definition() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_definition(
                &mut project_conn,
                sense_id,
                Some("new definition"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.senses()[0].definition().as_deref(),
                Some("new definition")
            );
        }

        #[test]
        fn updates_sense_definition_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_definition(
                &mut project_conn,
                sense_id,
                Some("new definition"),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.senses()[0].definition().as_deref(),
                Some("new definition")
            );
        }
    }

    mod update_sense_category {
        use super::*;

        #[test]
        fn returns_entry_with_updated_sense_category() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let existent_category = category(&mut project_conn, "Noun", None);

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_category(
                &mut project_conn,
                sense_id,
                Some(existent_category.get()),
                entry.id().unwrap().get(),
            )
            .unwrap();

            assert_eq!(
                updated_entry.senses()[0].category_id().map(CategoryId::get),
                Some(existent_category.get())
            );
        }

        #[test]
        fn updates_sense_category_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let existent_category = category(&mut project_conn, "Noun", None);

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry = update_sense_category(
                &mut project_conn,
                sense_id,
                Some(existent_category.get()),
                entry.id().unwrap().get(),
            )
            .unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(
                saved_entry.senses()[0].category_id().map(CategoryId::get),
                Some(existent_category.get())
            );
        }
    }

    mod move_sense {
        use super::*;

        #[test]
        fn returns_entry_with_reordered_senses() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation 1",
                Some("definition 1"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation 2",
                Some("definition 2"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry =
                move_sense(&mut project_conn, sense_id, 2, entry.id().unwrap().get()).unwrap();

            assert_eq!(
                updated_entry.senses()[0].translation().as_str(),
                "translation 2"
            );
            assert_eq!(
                updated_entry.senses()[1].translation().as_str(),
                "translation 1"
            );
        }

        #[test]
        fn reorders_pronunciations_in_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation 1",
                Some("definition 1"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation 2",
                Some("definition 2"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry =
                move_sense(&mut project_conn, sense_id, 2, entry.id().unwrap().get()).unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();
            assert_eq!(
                saved_entry.senses()[0].translation().as_str(),
                "translation 2"
            );
            assert_eq!(
                saved_entry.senses()[1].translation().as_str(),
                "translation 1"
            );
        }
    }

    mod remove_sense {
        use super::*;

        #[test]
        fn returns_entry_without_sense() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry =
                remove_sense(&mut project_conn, sense_id, entry.id().unwrap().get()).unwrap();

            assert_eq!(updated_entry.senses().len(), 0);
        }

        #[test]
        fn removes_sense_from_database() {
            let mut project_conn = setup();

            let entry = create_entry(&mut project_conn, "entry", None).unwrap();

            let updated_entry = add_sense(
                &mut project_conn,
                "translation",
                Some("definition"),
                None,
                entry.id().unwrap().get(),
            )
            .unwrap();

            let sense_id = updated_entry.senses()[0].id().unwrap().get();

            let updated_entry =
                remove_sense(&mut project_conn, sense_id, entry.id().unwrap().get()).unwrap();

            let repo = EntryRepository::new(&mut project_conn);

            let saved_entry = repo
                .find_by_id(updated_entry.id().unwrap())
                .unwrap()
                .unwrap();

            assert_eq!(saved_entry.senses().len(), 0);
        }
    }
}
