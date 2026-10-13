use rusqlite::{params, Connection, OptionalExtension};

use crate::{
    infrastructure::database::DatabaseError,
    models::category::{Category, CategoryDescription, CategoryId, CategoryName},
};

pub struct CategoryRepository<'a> {
    connection: &'a mut Connection,
}
impl<'a> CategoryRepository<'a> {
    pub fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }

    pub fn find_by_id(&self, id: CategoryId) -> Result<Option<Category>, DatabaseError> {
        let id = id.get();

        let row: Option<(i64, String, Option<String>)> = self
            .connection
            .query_row(
                "SELECT id, name, description
                FROM categories
                WHERE id = ?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(DatabaseError::FailedToQueryData)?;

        let Some((id, name, description)) = row else {
            return Ok(None);
        };

        let id = CategoryId::new(id);
        let name = CategoryName::new(name).map_err(|_| DatabaseError::InvalidStoredData)?;
        let description = CategoryDescription::new(description);

        Ok(Some(Category::from_existing(id, name, description)))
    }

    pub fn list(&self) -> Result<Vec<Category>, DatabaseError> {
        let mut stmt = self
            .connection
            .prepare("SELECT id, name, description FROM categories")
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                ))
            })
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        rows.into_iter()
            .map(|(id, name, description)| {
                let id = CategoryId::new(id);

                let name = CategoryName::new(name).map_err(|_| DatabaseError::InvalidStoredData)?;

                let description = CategoryDescription::new(description);

                Ok(Category::from_existing(id, name, description))
            })
            .collect()
    }

    pub fn save(&mut self, category: &Category) -> Result<Category, DatabaseError> {
        let name = category.name().as_str();
        let description = category.description().as_deref();

        let category_id: CategoryId;

        match category.id() {
            Some(id) => {
                self.connection
                    .execute(
                        "UPDATE categories SET name = ?1, description = ?2 WHERE id = ?3",
                        params![name, description, id.get()],
                    )
                    .map_err(DatabaseError::FailedToUpdateData)?;
                category_id = id;
            }
            None => {
                self.connection
                    .execute(
                        "INSERT INTO categories (name, description) VALUES (?1, ?2) ",
                        params![name, description],
                    )
                    .map_err(DatabaseError::FailedToInsertData)?;

                category_id = CategoryId::new(self.connection.last_insert_rowid());
            }
        }

        let category = self
            .find_by_id(category_id)?
            .ok_or(DatabaseError::InvalidStoredData)?;

        Ok(category)
    }

    pub fn delete(&mut self, id: CategoryId) -> Result<(), DatabaseError> {
        let id = id.get();

        let changed = self
            .connection
            .execute("DELETE FROM categories WHERE id = ?1", params![id])
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

    fn insert_category(
        connection: &mut Connection,
        name: &str,
        description: Option<&str>,
    ) -> CategoryId {
        connection
            .execute(
                "INSERT INTO categories (name, description) VALUES (?1, ?2)",
                params![name, description],
            )
            .unwrap();

        CategoryId::new(connection.last_insert_rowid())
    }

    #[test]
    fn find_by_id_with_valid_id_returns_category_() {
        let mut connection = setup();

        let id = insert_category(&mut connection, "noun", Some("description"));

        let repo = CategoryRepository::new(&mut connection);

        let result = repo.find_by_id(id);

        assert!(result.is_ok());

        let category = result.unwrap().unwrap();

        assert_eq!(category.id(), Some(id));
        assert_eq!(category.name().as_str(), "noun");
        assert_eq!(category.description().as_deref(), Some("description"));
    }

    #[test]
    fn list_returns_all_created_categories() {
        let mut connection = setup();

        insert_category(&mut connection, "noun", Some("noun description"));
        insert_category(&mut connection, "verb", Some("verb description"));

        let repo = CategoryRepository::new(&mut connection);

        let categories = repo.list().unwrap();

        assert_eq!(categories.len(), 2);

        assert_eq!(categories[0].name().as_str(), "noun");
        assert_eq!(
            categories[0].description().as_deref(),
            Some("noun description")
        );
        assert_eq!(categories[1].name().as_str(), "verb");
        assert_eq!(
            categories[1].description().as_deref(),
            Some("verb description")
        );
    }

    #[test]
    fn save_updates_existing_category() {
        let mut connection = setup();

        let id = insert_category(&mut connection, "noun", Some("noun description"));

        let mut repo = CategoryRepository::new(&mut connection);

        let mut category = repo.find_by_id(id).unwrap().unwrap();

        category.set_name(CategoryName::new("verb").unwrap());
        category.set_description(CategoryDescription::new(Some("verb description")));

        let saved = repo.save(&category).unwrap();
        let existing = repo.find_by_id(id).unwrap().unwrap();

        assert_eq!(saved.id(), Some(id));
        assert_eq!(saved.name().as_str(), "verb");
        assert_eq!(saved.description().as_deref(), Some("verb description"));

        assert_eq!(existing.id(), Some(id));
        assert_eq!(existing.name().as_str(), "verb");
        assert_eq!(existing.description().as_deref(), Some("verb description"));

        assert_eq!(saved.name(), existing.name());
        assert_eq!(saved.description(), existing.description());
    }

    #[test]
    fn save_inserts_new_category() {
        let mut connection = setup();
        let mut repo = CategoryRepository::new(&mut connection);

        let category = Category::new(
            CategoryName::new("adjective").unwrap(),
            CategoryDescription::new(Some("adjective description")),
        );

        let saved = repo.save(&category).unwrap();

        assert!(saved.id().is_some());
        assert_eq!(saved.name().as_str(), "adjective");
        assert_eq!(
            saved.description().as_deref(),
            Some("adjective description")
        );

        let loaded = repo.find_by_id(saved.id().unwrap()).unwrap().unwrap();

        assert_eq!(loaded, saved);
    }

    #[test]
    fn delete_removes_existing_category() {
        let mut connection = setup();

        let id = insert_category(&mut connection, "noun", Some("noun description"));

        let mut repo = CategoryRepository::new(&mut connection);

        repo.delete(id).unwrap();

        let deleted = repo.find_by_id(id).unwrap();

        assert_eq!(deleted, None);
    }
}
