use rusqlite::{params, Connection, OptionalExtension};

use crate::{
    infrastructure::database::DatabaseError,
    models::morph_type::{MorphType, MorphTypeCode, MorphTypeId, MorphTypeLabel},
};

pub struct MorphTypeRepository<'a> {
    connection: &'a mut Connection,
}

impl<'a> MorphTypeRepository<'a> {
    pub fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }

    pub fn find_by_id(&self, id: MorphTypeId) -> Result<Option<MorphType>, DatabaseError> {
        let id = id.get();

        let row: Option<(i64, String, String, bool)> = self
            .connection
            .query_row(
                "SELECT id, code, label, is_bound
                 FROM morph_types
                 WHERE id = ?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .optional()
            .map_err(DatabaseError::FailedToQueryData)?;

        let Some((id, code, label, is_bound)) = row else {
            return Ok(None);
        };

        let id = MorphTypeId::new(id);
        let code = MorphTypeCode::new(code).map_err(|_| DatabaseError::InvalidStoredData)?;
        let label = MorphTypeLabel::new(label).map_err(|_| DatabaseError::InvalidStoredData)?;

        Ok(Some(MorphType::from_existing(id, code, label, is_bound)))
    }

    pub fn list(&self) -> Result<Vec<MorphType>, DatabaseError> {
        let mut stmt = self
            .connection
            .prepare("SELECT id, code, label, is_bound FROM morph_types")
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, bool>(3)?,
                ))
            })
            .map_err(DatabaseError::FailedToQueryData)?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        let mut morph_types = Vec::with_capacity(rows.len());

        for (id, code, label, is_bound) in rows {
            let id = MorphTypeId::new(id);
            let code = MorphTypeCode::new(code).map_err(|_| DatabaseError::InvalidStoredData)?;
            let label = MorphTypeLabel::new(label).map_err(|_| DatabaseError::InvalidStoredData)?;

            morph_types.push(MorphType::from_existing(id, code, label, is_bound));
        }

        Ok(morph_types)
    }

    pub fn save(&mut self, morph_type: &MorphType) -> Result<MorphType, DatabaseError> {
        let code = morph_type.code().as_str();
        let label = morph_type.label().as_str();
        let is_bound = morph_type.is_bound();

        let morph_type_id = match morph_type.id() {
            Some(id) => {
                self.connection
                    .execute(
                        "UPDATE morph_types SET code = ?1, label = ?2, is_bound = ?3 WHERE id = ?4",
                        params![code, label, is_bound, id.get()],
                    )
                    .map_err(DatabaseError::FailedToUpdateData)?;

                id
            }
            None => {
                self.connection
                    .execute(
                        "INSERT INTO morph_types (code, label, is_bound) VALUES (?1, ?2, ?3)",
                        params![code, label, is_bound],
                    )
                    .map_err(DatabaseError::FailedToInsertData)?;

                MorphTypeId::new(self.connection.last_insert_rowid())
            }
        };

        self.find_by_id(morph_type_id)?
            .ok_or(DatabaseError::InvalidStoredData)
    }

    pub fn delete(&mut self, id: MorphTypeId) -> Result<(), DatabaseError> {
        let changed = self
            .connection
            .execute("DELETE FROM morph_types WHERE id = ?1", params![id.get()])
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

    fn insert_morph_type(
        connection: &mut Connection,
        code: &str,
        label: &str,
        is_bound: bool,
    ) -> MorphTypeId {
        connection
            .execute(
                "INSERT INTO morph_types (code, label, is_bound) VALUES (?1, ?2, ?3)",
                params![code, label, is_bound],
            )
            .unwrap();

        MorphTypeId::new(connection.last_insert_rowid())
    }

    #[test]
    fn find_by_id_with_valid_id_returns_morph_type() {
        let mut connection = setup();

        let id = insert_morph_type(&mut connection, "root", "Root", false);

        let repo = MorphTypeRepository::new(&mut connection);

        let result = repo.find_by_id(id).unwrap().unwrap();

        assert_eq!(result.id(), Some(id));
        assert_eq!(result.code().as_str(), "root");
        assert_eq!(result.label().as_str(), "Root");
        assert!(!result.is_bound());
    }

    #[test]
    fn list_returns_all_created_morph_types() {
        let mut connection = setup();

        insert_morph_type(&mut connection, "root", "Root", false);
        insert_morph_type(&mut connection, "bound_root", "Bound Root", true);

        let repo = MorphTypeRepository::new(&mut connection);

        let morph_types = repo.list().unwrap();

        assert_eq!(morph_types.len(), 2);
        assert!(morph_types.iter().any(|m| m.code().as_str() == "root"));
        assert!(morph_types
            .iter()
            .any(|m| m.code().as_str() == "bound_root"));
    }

    #[test]
    fn save_updates_existing_morph_type() {
        let mut connection = setup();

        let id = insert_morph_type(&mut connection, "root", "Root", false);

        let mut repo = MorphTypeRepository::new(&mut connection);

        let mut morph_type = repo.find_by_id(id).unwrap().unwrap();

        morph_type.set_code(MorphTypeCode::new("bound_root").unwrap());
        morph_type.set_label(MorphTypeLabel::new("Bound Root").unwrap());
        morph_type.set_bound(true);

        let saved = repo.save(&morph_type).unwrap();

        assert_eq!(saved.id(), Some(id));
        assert_eq!(saved.code().as_str(), "bound_root");
        assert_eq!(saved.label().as_str(), "Bound Root");
        assert!(saved.is_bound());
    }

    #[test]
    fn save_inserts_new_morph_type() {
        let mut connection = setup();

        let mut repo = MorphTypeRepository::new(&mut connection);

        let morph_type = MorphType::new(
            MorphTypeCode::new("root").unwrap(),
            MorphTypeLabel::new("Root").unwrap(),
            false,
        );

        let saved = repo.save(&morph_type).unwrap();

        assert!(saved.id().is_some());
        assert_eq!(saved.code().as_str(), "root");
        assert_eq!(saved.label().as_str(), "Root");
        assert!(!saved.is_bound());
    }

    #[test]
    fn delete_removes_existing_morph_type() {
        let mut connection = setup();

        let id = insert_morph_type(&mut connection, "root", "Root", false);

        let mut repo = MorphTypeRepository::new(&mut connection);

        repo.delete(id).unwrap();

        assert!(repo.find_by_id(id).unwrap().is_none());
    }
}
