use rusqlite::Connection;
use thiserror::Error;

use crate::{
    infrastructure::{
        database::{projects::repositories::category::CategoryRepository, DatabaseError},
        InfrastructureError,
    },
    models::category::{Category, CategoryDescription, CategoryError, CategoryId, CategoryName},
};

#[derive(Debug, Error)]
pub enum CategoryServiceError {
    #[error(transparent)]
    Infrastructure(#[from] InfrastructureError),

    #[error(transparent)]
    Database(#[from] DatabaseError),

    #[error(transparent)]
    Model(#[from] CategoryError),
}

pub fn create_category(
    project_conn: &mut Connection,
    name: &str,
    description: Option<&str>,
) -> Result<Category, CategoryServiceError> {
    let name = CategoryName::new(name)?;
    let description = CategoryDescription::new(description);

    let category = Category::new(name, description);

    let mut repo = CategoryRepository::new(project_conn);

    Ok(repo.save(&category)?)
}

pub fn list_categories(
    project_conn: &mut Connection,
) -> Result<Vec<Category>, CategoryServiceError> {
    let repo = CategoryRepository::new(project_conn);

    Ok(repo.list()?)
}

pub fn update_name(
    project_conn: &mut Connection,
    category_id: i64,
    name: &str,
) -> Result<Category, CategoryServiceError> {
    let id = CategoryId::new(category_id);

    let mut repo = CategoryRepository::new(project_conn);

    let mut category = repo.find_by_id(id)?.ok_or(DatabaseError::NotFound)?;

    let name = CategoryName::new(name)?;

    category.set_name(name);

    Ok(repo.save(&category)?)
}

pub fn update_description(
    project_conn: &mut Connection,
    category_id: i64,
    description: Option<&str>,
) -> Result<Category, CategoryServiceError> {
    let id = CategoryId::new(category_id);

    let mut repo = CategoryRepository::new(project_conn);

    let mut category = repo.find_by_id(id)?.ok_or(DatabaseError::NotFound)?;

    let description = CategoryDescription::new(description);

    category.set_description(description);

    Ok(repo.save(&category)?)
}

pub fn delete_category(
    project_conn: &mut Connection,
    category_id: i64,
) -> Result<(), CategoryServiceError> {
    let id = CategoryId::new(category_id);

    let mut repo = CategoryRepository::new(project_conn);

    repo.delete(id)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use crate::{
        infrastructure::database::projects::run_migrations,
        models::category::{CategoryDescription, CategoryName},
    };

    use super::*;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn create_category_returns_saved_category() {
        let mut conn = setup();

        let category = create_category(&mut conn, "noun", Some("person, place, thing")).unwrap();

        assert_eq!(category.name().as_str(), "noun");
        assert_eq!(
            category.description().as_deref(),
            Some("person, place, thing")
        );
        assert!(category.id().is_some());
    }

    #[test]
    fn create_category_rejects_invalid_name() {
        let mut conn = setup();

        let err = create_category(&mut conn, "", Some("desc")).unwrap_err();

        assert!(matches!(err, CategoryServiceError::Model(_)));
    }

    #[test]
    fn list_categories_returns_all_categories() {
        let mut conn = setup();

        create_category(&mut conn, "noun", Some("person, place, thing")).unwrap();
        create_category(&mut conn, "verb", Some("action, state")).unwrap();

        let categories = list_categories(&mut conn).unwrap();

        assert_eq!(categories.len(), 2);

        let names: Vec<String> = categories
            .iter()
            .map(|c| c.name().as_str().to_string())
            .collect();

        assert!(names.contains(&"noun".to_string()));
        assert!(names.contains(&"verb".to_string()));
    }

    #[test]
    fn update_name_updates_existing_category() {
        let mut conn = setup();

        let created = create_category(&mut conn, "noun", Some("old desc")).unwrap();

        let updated = update_name(&mut conn, created.id().unwrap().get(), "verb").unwrap();

        assert_eq!(updated.name().as_str(), "verb");
        assert_eq!(updated.id(), created.id());
    }

    #[test]
    fn update_description_updates_existing_category() {
        let mut conn = setup();

        let created = create_category(&mut conn, "noun", Some("old desc")).unwrap();

        let updated =
            update_description(&mut conn, created.id().unwrap().get(), Some("new desc")).unwrap();

        assert_eq!(updated.description().as_deref(), Some("new desc"));
    }

    #[test]
    fn delete_category_removes_existing_category() {
        let mut conn = setup();

        let created = create_category(&mut conn, "noun", Some("desc")).unwrap();

        delete_category(&mut conn, created.id().unwrap().get()).unwrap();

        let result = crate::infrastructure::database::projects::repositories::category::CategoryRepository::new(&mut conn)
            .find_by_id(created.id().unwrap())
            .unwrap();

        assert!(result.is_none());
    }

    #[test]
    fn update_name_for_missing_category_returns_not_found() {
        let mut conn = setup();

        let err = update_name(&mut conn, 999_999, "verb").unwrap_err();

        assert!(matches!(
            err,
            CategoryServiceError::Database(DatabaseError::NotFound)
        ));
    }
}
