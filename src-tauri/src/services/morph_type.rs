use rusqlite::Connection;
use thiserror::Error;

use crate::{
    infrastructure::{
        database::DatabaseError,
        database::projects::repositories::morph_type::MorphTypeRepository,
        InfrastructureError,
    },
    models::morph_type::{
        MorphType, MorphTypeCode, MorphTypeError, MorphTypeId, MorphTypeLabel,
    },
};

#[derive(Debug, Error)]
pub enum MorphTypeServiceError {
    #[error(transparent)]
    Infrastructure(#[from] InfrastructureError),

    #[error(transparent)]
    Database(#[from] DatabaseError),

    #[error(transparent)]
    Model(#[from] MorphTypeError),
}

pub fn create_morph_type(
    project_conn: &mut Connection,
    code: &str,
    label: &str,
    is_bound: bool,
) -> Result<MorphType, MorphTypeServiceError> {
    let code = MorphTypeCode::new(code)?;
    let label = MorphTypeLabel::new(label)?;
    let morph_type = MorphType::new(code, label, is_bound);

    let mut repo = MorphTypeRepository::new(project_conn);

    Ok(repo.save(&morph_type)?)
}

pub fn list_morph_types(project_conn: &mut Connection) -> Result<Vec<MorphType>, MorphTypeServiceError> {
    let repo = MorphTypeRepository::new(project_conn);

    Ok(repo.list()?)
}

pub fn update_code(
    project_conn: &mut Connection,
    morph_type_id: i64,
    code: &str,
) -> Result<MorphType, MorphTypeServiceError> {
    let id = MorphTypeId::new(morph_type_id);

    let mut repo = MorphTypeRepository::new(project_conn);

    let mut morph_type = repo.find_by_id(id)?.ok_or(DatabaseError::NotFound)?;

    morph_type.set_code(MorphTypeCode::new(code)?);

    Ok(repo.save(&morph_type)?)
}

pub fn update_label(
    project_conn: &mut Connection,
    morph_type_id: i64,
    label: &str,
) -> Result<MorphType, MorphTypeServiceError> {
    let id = MorphTypeId::new(morph_type_id);

    let mut repo = MorphTypeRepository::new(project_conn);

    let mut morph_type = repo.find_by_id(id)?.ok_or(DatabaseError::NotFound)?;

    morph_type.set_label(MorphTypeLabel::new(label)?);

    Ok(repo.save(&morph_type)?)
}

pub fn update_bound(
    project_conn: &mut Connection,
    morph_type_id: i64,
    is_bound: bool,
) -> Result<MorphType, MorphTypeServiceError> {
    let id = MorphTypeId::new(morph_type_id);

    let mut repo = MorphTypeRepository::new(project_conn);

    let mut morph_type = repo.find_by_id(id)?.ok_or(DatabaseError::NotFound)?;

    morph_type.set_bound(is_bound);

    Ok(repo.save(&morph_type)?)
}

pub fn delete_morph_type(
    project_conn: &mut Connection,
    morph_type_id: i64,
) -> Result<(), MorphTypeServiceError> {
    let id = MorphTypeId::new(morph_type_id);

    let mut repo = MorphTypeRepository::new(project_conn);

    repo.delete(id)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use crate::infrastructure::database::projects::run_migrations;

    use super::*;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn create_morph_type_returns_saved_morph_type() {
        let mut conn = setup();

        let morph_type = create_morph_type(&mut conn, "root", "Root", false).unwrap();

        assert_eq!(morph_type.code().as_str(), "root");
        assert_eq!(morph_type.label().as_str(), "Root");
        assert!(!morph_type.is_bound());
        assert!(morph_type.id().is_some());
    }

    #[test]
    fn create_morph_type_rejects_invalid_code() {
        let mut conn = setup();

        let err = create_morph_type(&mut conn, "", "Root", false).unwrap_err();

        assert!(matches!(err, MorphTypeServiceError::Model(_)));
    }

    #[test]
    fn list_morph_types_returns_all_records() {
        let mut conn = setup();

        create_morph_type(&mut conn, "root", "Root", false).unwrap();
        create_morph_type(&mut conn, "bound_root", "Bound root", true).unwrap();

        let morph_types = list_morph_types(&mut conn).unwrap();

        assert_eq!(morph_types.len(), 2);

        let codes: Vec<String> = morph_types
            .iter()
            .map(|m| m.code().as_str().to_string())
            .collect();

        assert!(codes.contains(&"root".to_string()));
        assert!(codes.contains(&"bound_root".to_string()));
    }

    #[test]
    fn update_code_updates_existing_morph_type() {
        let mut conn = setup();

        let created = create_morph_type(&mut conn, "root", "Root", false).unwrap();

        let updated = update_code(&mut conn, created.id().unwrap().get(), "bound_root").unwrap();

        assert_eq!(updated.code().as_str(), "bound_root");
        assert_eq!(updated.id(), created.id());
    }

    #[test]
    fn update_label_updates_existing_morph_type() {
        let mut conn = setup();

        let created = create_morph_type(&mut conn, "root", "Root", false).unwrap();

        let updated = update_label(&mut conn, created.id().unwrap().get(), "Bound root").unwrap();

        assert_eq!(updated.label().as_str(), "Bound root");
        assert_eq!(updated.id(), created.id());
    }

    #[test]
    fn update_bound_updates_existing_morph_type() {
        let mut conn = setup();

        let created = create_morph_type(&mut conn, "root", "Root", false).unwrap();

        let updated = update_bound(&mut conn, created.id().unwrap().get(), true).unwrap();

        assert!(updated.is_bound());
        assert_eq!(updated.id(), created.id());
    }

    #[test]
    fn delete_morph_type_removes_existing_record() {
        let mut conn = setup();

        let created = create_morph_type(&mut conn, "root", "Root", false).unwrap();

        delete_morph_type(&mut conn, created.id().unwrap().get()).unwrap();

        let result = crate::infrastructure::database::projects::repositories::morph_type::MorphTypeRepository::new(&mut conn)
            .find_by_id(created.id().unwrap())
            .unwrap();

        assert!(result.is_none());
    }

    #[test]
    fn update_code_for_missing_morph_type_returns_not_found() {
        let mut conn = setup();

        let err = update_code(&mut conn, 999_999, "bound_root").unwrap_err();

        assert!(matches!(
            err,
            MorphTypeServiceError::Database(DatabaseError::NotFound)
        ));
    }
}