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

    fn pron(value: &str) -> PronunciationValue {
        PronunciationValue::new(value.to_string()).unwrap()
    }

    #[test]
    fn save_new_entry_assigns_id_and_roundtrips() {
        let mut conn = setup();
        let mut repo = EntryRepository::new(&mut conn);

        let saved = repo
            .save(&Entry::new(EntryForm::new("casa").unwrap()))
            .unwrap();

        assert!(saved.id().is_some());
        assert_eq!(saved.form().as_str(), "casa");
        assert!(saved.pronunciations().is_empty());
        assert!(saved.senses().is_empty());
        assert_eq!(saved.morph_type_id(), None);

        let loaded = repo.find_by_id(saved.id().unwrap()).unwrap().unwrap();
        assert_eq!(loaded, saved);
    }

    #[test]
    fn save_inserts_then_removes_and_renumbers() {
        let mut conn = setup();
        let mut repo = EntryRepository::new(&mut conn);

        let mut entry = Entry::new(EntryForm::new("casa").unwrap());
        for v in ["a", "b", "c"] {
            entry.add_pronunciation(pron(v), PronunciationDescription::default());
        }

        let mut saved = repo.save(&entry).unwrap();
        assert!(saved.id().is_some());
        assert_eq!(saved.pronunciations().len(), 3);

        let middle = saved.pronunciations()[1].id().unwrap();
        saved.remove_pronunciation(middle).unwrap();
        let saved = repo.save(&saved).unwrap();

        let orders: Vec<i64> = saved
            .pronunciations()
            .iter()
            .map(|p| p.sort_order().get())
            .collect();
        assert_eq!(orders, vec![1, 2]);
    }
}
