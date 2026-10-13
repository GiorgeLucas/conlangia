use rusqlite::{params, Connection, OptionalExtension, Transaction};

use crate::{
    infrastructure::database::DatabaseError,
    models::{
        category::CategoryId,
        entry::{
            pronunciation::{
                Pronunciation, PronunciationDescription, PronunciationId, PronunciationSortOrder,
                PronunciationValue,
            },
            sense::{Sense, SenseDefinition, SenseId, SenseSortOrder, SenseTranslation},
            Entry, EntryForm, EntryId,
        },
        morph_type::MorphTypeId,
    },
};

pub struct EntryRepository<'a> {
    connection: &'a mut Connection,
}
impl<'a> EntryRepository<'a> {
    pub fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }

    fn find_pronunciations_for_entry(
        &self,
        entry_id: i64,
    ) -> Result<Vec<Pronunciation>, DatabaseError> {
        let mut stmt = self
            .connection
            .prepare(
                "SELECT id, value, description, sort_order 
                FROM pronunciations 
                WHERE entry_id = ?1
                ORDER BY sort_order",
            )
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map(params![entry_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .map_err(DatabaseError::FailedToQueryData)?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        rows.into_iter()
            .map(|row| {
                let id = PronunciationId::new(row.0);

                let value =
                    PronunciationValue::new(row.1).map_err(|_| DatabaseError::InvalidStoredData)?;

                let description = PronunciationDescription::new(row.2);

                let sort_order = PronunciationSortOrder::new(row.3)
                    .map_err(|_| DatabaseError::InvalidStoredData)?;

                Ok(Pronunciation::from_existing(
                    id,
                    value,
                    description,
                    sort_order,
                ))
            })
            .collect()
    }

    fn find_senses_for_entry(&self, entry_id: i64) -> Result<Vec<Sense>, DatabaseError> {
        let mut stmt = self
            .connection
            .prepare(
                "SELECT id, translation, definition, sort_order, category_id 
                FROM senses 
                WHERE entry_id = ?1
                ORDER BY sort_order",
            )
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map(params![entry_id], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, Option<i64>>(4)?,
                ))
            })
            .map_err(DatabaseError::FailedToQueryData)?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        rows.into_iter()
            .map(|row| {
                let id = SenseId::new(row.0);

                let translation =
                    SenseTranslation::new(row.1).map_err(|_| DatabaseError::InvalidStoredData)?;

                let definition = SenseDefinition::new(row.2);

                let sort_order =
                    SenseSortOrder::new(row.3).map_err(|_| DatabaseError::InvalidStoredData)?;

                let category_id = row.4.map(CategoryId::new);

                Ok(Sense::from_existing(
                    id,
                    translation,
                    definition,
                    sort_order,
                    category_id,
                ))
            })
            .collect()
    }

    pub fn find_by_id(&self, id: EntryId) -> Result<Option<Entry>, DatabaseError> {
        let id = id.get();

        let row: Option<(i64, String, Option<i64>)> = self
            .connection
            .query_row(
                "SELECT id, entry_form, morph_type_id
                FROM entries
                WHERE id = ?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(DatabaseError::FailedToQueryData)?;

        let Some((id, entry_form, morph_type_id)) = row else {
            return Ok(None);
        };

        let id = EntryId::new(id);
        let entry_form =
            EntryForm::new(entry_form).map_err(|_| DatabaseError::InvalidStoredData)?;
        let morph_type_id = morph_type_id.map(MorphTypeId::new);

        let pronunciations = self.find_pronunciations_for_entry(id.get())?;
        let senses = self.find_senses_for_entry(id.get())?;

        Ok(Some(Entry::from_existing(
            id,
            entry_form,
            pronunciations,
            senses,
            morph_type_id,
        )))
    }

    pub fn list(&self) -> Result<Vec<Entry>, DatabaseError> {
        let mut stmt = self
            .connection
            .prepare("SELECT id, entry_form, morph_type_id FROM entries")
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<i64>>(2)?,
                ))
            })
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        rows.into_iter()
            .map(|(id, entry_form, morph_type_id)| {
                let id = EntryId::new(id);

                let entry_form =
                    EntryForm::new(entry_form).map_err(|_| DatabaseError::InvalidStoredData)?;

                let morph_type_id = morph_type_id.map(MorphTypeId::new);

                let pronunciations = self.find_pronunciations_for_entry(id.get())?;
                let senses = self.find_senses_for_entry(id.get())?;

                Ok(Entry::from_existing(
                    id,
                    entry_form,
                    pronunciations,
                    senses,
                    morph_type_id,
                ))
            })
            .collect()
    }

    fn save_entry_row(tx: &Transaction, entry: &Entry) -> Result<EntryId, DatabaseError> {
        let form = entry.form().as_str();
        let morph_type_id = entry.morph_type_id().map(MorphTypeId::get);

        match entry.id() {
            None => {
                tx.execute(
                    "INSERT INTO entries (entry_form, morph_type_id) VALUES (?1, ?2)",
                    params![form, morph_type_id],
                )
                .map_err(DatabaseError::FailedToInsertData)?;
                Ok(EntryId::new(tx.last_insert_rowid()))
            }
            Some(id) => {
                let changed = tx
                    .execute(
                        "UPDATE entries SET entry_form = ?1, morph_type_id = ?2 WHERE id = ?3",
                        params![form, morph_type_id, id.get()],
                    )
                    .map_err(DatabaseError::FailedToUpdateData)?;
                if changed == 0 {
                    return Err(DatabaseError::NotFound);
                }
                Ok(id)
            }
        }
    }

    fn save_pronunciations(
        tx: &Transaction,
        entry_id: EntryId,
        pronunciations: &[Pronunciation],
    ) -> Result<(), DatabaseError> {
        let kept: Vec<i64> = pronunciations
            .iter()
            .filter_map(|p| p.id())
            .map(PronunciationId::get)
            .collect();

        let mut stmt = tx
            .prepare("SELECT id FROM pronunciations WHERE entry_id = ?1")
            .map_err(DatabaseError::FailedToQueryData)?;

        let stored = stmt
            .query_map(params![entry_id.get()], |row| row.get::<_, i64>(0))
            .map_err(DatabaseError::FailedToQueryData)?
            .collect::<rusqlite::Result<Vec<i64>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        for id in stored {
            if !kept.contains(&id) {
                tx.execute("DELETE FROM pronunciations WHERE id = ?1", params![id])
                    .map_err(DatabaseError::FailedToDeleteData)?;
            }
        }

        for p in pronunciations {
            let value = p.value().as_str();
            let description = p.description().as_deref();
            let sort_order = p.sort_order().get();

            match p.id() {
                None => {
                    tx.execute(
                        "INSERT INTO pronunciations (entry_id, value, description, sort_order)
                     VALUES (?1, ?2, ?3, ?4)",
                        params![entry_id.get(), value, description, sort_order],
                    )
                    .map_err(DatabaseError::FailedToInsertData)?;
                }
                Some(id) => {
                    tx.execute(
                        "UPDATE pronunciations
                     SET value = ?1, description = ?2, sort_order = ?3
                     WHERE id = ?4 AND entry_id = ?5",
                        params![value, description, sort_order, id.get(), entry_id.get()],
                    )
                    .map_err(DatabaseError::FailedToUpdateData)?;
                }
            }
        }

        Ok(())
    }

    fn save_senses(
        tx: &Transaction,
        entry_id: EntryId,
        senses: &[Sense],
    ) -> Result<(), DatabaseError> {
        let kept: Vec<i64> = senses
            .iter()
            .filter_map(|s| s.id())
            .map(SenseId::get)
            .collect();

        let mut stmt = tx
            .prepare("SELECT id FROM senses WHERE entry_id = ?1")
            .map_err(DatabaseError::FailedToQueryData)?;

        let stored = stmt
            .query_map(params![entry_id.get()], |row| row.get::<_, i64>(0))
            .map_err(DatabaseError::FailedToQueryData)?
            .collect::<rusqlite::Result<Vec<i64>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        for id in stored {
            if !kept.contains(&id) {
                tx.execute("DELETE FROM senses WHERE id = ?1", params![id])
                    .map_err(DatabaseError::FailedToDeleteData)?;
            }
        }

        for s in senses {
            let translation = s.translation().as_str();
            let definition = s.definition().as_deref();
            let sort_order = s.sort_order().get();
            let category_id = s.category_id().map(CategoryId::get);

            match s.id() {
                None => {
                    tx.execute(
                        "INSERT INTO senses (entry_id, translation, definition, sort_order, category_id)
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![entry_id.get(), translation, definition, sort_order, category_id],
                    )
                    .map_err(DatabaseError::FailedToInsertData)?;
                }
                Some(id) => {
                    tx.execute(
                        "UPDATE senses
                     SET translation = ?1, definition = ?2, sort_order = ?3, category_id = ?4
                     WHERE id = ?5 AND entry_id = ?6",
                        params![
                            translation,
                            definition,
                            sort_order,
                            category_id,
                            id.get(),
                            entry_id.get()
                        ],
                    )
                    .map_err(DatabaseError::FailedToUpdateData)?;
                }
            }
        }

        Ok(())
    }

    pub fn save(&mut self, entry: &Entry) -> Result<Entry, DatabaseError> {
        let tx = self
            .connection
            .transaction()
            .map_err(DatabaseError::FailedToStartTransaction)?;

        let entry_id = Self::save_entry_row(&tx, entry)?;
        Self::save_pronunciations(&tx, entry_id, entry.pronunciations())?;
        Self::save_senses(&tx, entry_id, entry.senses())?;

        tx.commit()
            .map_err(DatabaseError::FailedToCommitTransaction)?;

        self.find_by_id(entry_id)?.ok_or(DatabaseError::NotFound)
    }

    pub fn delete(&mut self, id: EntryId) -> Result<(), DatabaseError> {
        let changed = self
            .connection
            .execute("DELETE FROM entries WHERE id = ?1", params![id.get()])
            .map_err(DatabaseError::FailedToDeleteData)?;

        if changed == 0 {
            return Err(DatabaseError::NotFound);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::params;

    use crate::infrastructure;

    use super::*;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        infrastructure::database::projects::run_migrations(&mut conn).unwrap();
        conn
    }

    fn pron_value(value: &str) -> PronunciationValue {
        PronunciationValue::new(value).unwrap()
    }

    fn pron_description(description: Option<&str>) -> PronunciationDescription {
        PronunciationDescription::new(description)
    }

    fn sense_translation(translation: &str) -> SenseTranslation {
        SenseTranslation::new(translation).unwrap()
    }

    fn sense_definition(definition: Option<&str>) -> SenseDefinition {
        SenseDefinition::new(definition)
    }

    fn insert_entry(connection: &mut Connection, form: &str, morph_type_id: Option<i64>) -> i64 {
        connection
            .execute(
                "INSERT INTO entries (entry_form, morph_type_id) VALUES (?1, ?2)",
                params![form, morph_type_id],
            )
            .unwrap();

        connection.last_insert_rowid()
    }

    fn insert_pronunciation(
        connection: &mut Connection,
        entry_id: i64,
        value: &str,
        description: Option<&str>,
        sort_order: i64,
    ) -> i64 {
        connection
            .execute(
                "INSERT INTO pronunciations (entry_id, value, description, sort_order)
                 VALUES (?1, ?2, ?3, ?4)",
                params![entry_id, value, description, sort_order],
            )
            .unwrap();

        connection.last_insert_rowid()
    }

    fn insert_sense(
        connection: &mut Connection,
        entry_id: i64,
        translation: &str,
        definition: Option<&str>,
        sort_order: i64,
        category_id: Option<i64>,
    ) -> i64 {
        connection
            .execute(
                "INSERT INTO senses (entry_id, translation, definition, sort_order, category_id)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![entry_id, translation, definition, sort_order, category_id],
            )
            .unwrap();

        connection.last_insert_rowid()
    }

    #[test]
    fn find_by_id_with_valid_id_returns_entry_with_children() {
        let mut conn = setup();

        let entry_id = insert_entry(&mut conn, "house", None);

        insert_pronunciation(&mut conn, entry_id, "pron 1", Some("desc 1"), 1);
        insert_pronunciation(&mut conn, entry_id, "pron 2", None, 2);

        insert_sense(&mut conn, entry_id, "translation 1", Some("definition 1"), 1, None);
        insert_sense(&mut conn, entry_id, "translation 2", Some("definition 2"), 2, None);

        let repo = EntryRepository::new(&mut conn);

        let entry = repo.find_by_id(EntryId::new(entry_id)).unwrap().unwrap();

        assert_eq!(entry.form().as_str(), "house");
        assert_eq!(entry.pronunciations().len(), 2);
        assert_eq!(entry.senses().len(), 2);
    }

    #[test]
    fn find_by_id_with_missing_id_returns_none() {
        let mut conn = setup();

        let repo = EntryRepository::new(&mut conn);

        let result = repo.find_by_id(EntryId::new(999999));

        assert!(result.unwrap().is_none());
    }

    #[test]
    fn save_inserts_new_entry_with_pronunciations_and_senses() {
        let mut conn = setup();

        let mut repo = EntryRepository::new(&mut conn);

        let mut entry = Entry::new(EntryForm::new("house").unwrap());

        entry.add_pronunciation(pron_value("pron 1"), pron_description(Some("desc 1")));
        entry.add_sense(
            sense_translation("translation 1"),
            sense_definition(Some("definition 1")),
            None,
        );
        entry.add_sense(
            sense_translation("translation 2"),
            sense_definition(None),
            None,
        );

        let saved = repo.save(&entry).unwrap();

        assert!(saved.id().is_some());
        assert_eq!(saved.form().as_str(), "house");
        assert_eq!(saved.pronunciations().len(), 1);
        assert_eq!(saved.senses().len(), 2);
    }

    #[test]
    fn save_updates_existing_entry_and_syncs_children() {
        let mut conn = setup();

        let mut repo = EntryRepository::new(&mut conn);

        let mut entry = Entry::new(EntryForm::new("house").unwrap());
        entry.add_pronunciation(pron_value("pron 1"), pron_description(None));
        entry.add_sense(
            sense_translation("translation 1"),
            sense_definition(None),
            None,
        );

        let saved = repo.save(&entry).unwrap();

        let mut persisted = repo.find_by_id(saved.id().unwrap()).unwrap().unwrap();

        persisted.add_pronunciation(pron_value("pron 2"), pron_description(Some("desc 2")));
        persisted.add_sense(
            sense_translation("translation 2"),
            sense_definition(Some("definition 2")),
            None,
        );

        let updated = repo.save(&persisted).unwrap();

        assert_eq!(updated.form().as_str(), "house");
        assert_eq!(updated.pronunciations().len(), 2);
        assert_eq!(updated.senses().len(), 2);
    }

    #[test]
    fn save_removes_deleted_children() {
        let mut conn = setup();

        let mut repo = EntryRepository::new(&mut conn);

        let mut entry = Entry::new(EntryForm::new("house").unwrap());
        entry.add_pronunciation(pron_value("pron 1"), pron_description(None));
        entry.add_pronunciation(pron_value("pron 2"), pron_description(None));

        entry.add_sense(
            sense_translation("translation 1"),
            sense_definition(None),
            None,
        );
        entry.add_sense(
            sense_translation("translation 2"),
            sense_definition(None),
            None,
        );

        let saved = repo.save(&entry).unwrap();

        let mut persisted = repo.find_by_id(saved.id().unwrap()).unwrap().unwrap();

        let first_pron_id = persisted.pronunciations()[0].id().unwrap();
        let first_sense_id = persisted.senses()[0].id().unwrap();

        persisted.remove_pronunciation(first_pron_id).unwrap();
        persisted.remove_sense(first_sense_id).unwrap();

        let updated = repo.save(&persisted).unwrap();

        assert_eq!(updated.pronunciations().len(), 1);
        assert_eq!(updated.senses().len(), 1);
    }

    #[test]
    fn delete_removes_existing_entry() {
        let mut conn = setup();

        let mut repo = EntryRepository::new(&mut conn);

        let entry = Entry::new(EntryForm::new("house").unwrap());
        let saved = repo.save(&entry).unwrap();

        repo.delete(saved.id().unwrap()).unwrap();

        assert!(repo.find_by_id(saved.id().unwrap()).unwrap().is_none());
    }

    #[test]
    fn delete_missing_entry_returns_not_found() {
        let mut conn = setup();

        let mut repo = EntryRepository::new(&mut conn);

        let err = repo.delete(EntryId::new(999999)).unwrap_err();

        assert!(matches!(err, DatabaseError::NotFound));
    }
}
