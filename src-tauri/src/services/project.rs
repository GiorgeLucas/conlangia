use std::path::Path;

use rusqlite::{params, Connection};
use thiserror::Error;

use crate::{
    commands::project::ProjectDto,
    infrastructure::{self, database::DatabaseError, InfrastructureError},
    models::project::ProjectMetadata,
};

#[derive(Debug, Error)]
pub enum ProjectServiceError {
    #[error(transparent)]
    InfrastructureError(#[from] InfrastructureError),

    #[error("project name cannot be blank")]
    ProjectNameIsBlank,
}

const DEFAULT_CATEGORIES: [(&str, &str); 14] = [
    ("Noun", "Names a person, place, thing, or idea."),
    ("Verb", "Expresses an action, event, or state."),
    ("Adjective", "Describes or modifies a noun or pronoun."),
    (
        "Adverb",
        "Modifies a verb, adjective, another adverb, or a clause.",
    ),
    (
        "Pronoun",
        "Stands in for a noun phrase or refers to its participants.",
    ),
    (
        "Preposition",
        "Relates a noun phrase to another element and precedes it.",
    ),
    (
        "Postposition",
        "Relates a noun phrase to another element and follows it.",
    ),
    ("Conjunction", "Connects words, phrases, or clauses."),
    (
        "Interjection",
        "Expresses an exclamation or standalone reaction.",
    ),
    ("Particle", "Adds grammatical or pragmatic meaning."),
    (
        "Determiner",
        "Specifies, identifies, or quantifies a noun phrase.",
    ),
    (
        "Adposition",
        "Relates a noun phrase to another element, occurring before or after it.",
    ),
    ("Numeral", "Expresses number, quantity, or order."),
    (
        "Demonstrative",
        "Identifies a referent by distance or discourse context.",
    ),
];

const DEFAULT_MORPH_TYPES: [(&str, &str, bool); 6] = [
    ("stem", "Stem", false),
    ("root", "Root", false),
    ("bound-root", "Bound Root", true),
    ("prefix", "Prefix", true),
    ("suffix", "Suffix", true),
    ("infix", "Infix", true),
];

fn is_string_blank(value: &str) -> bool {
    value.trim().is_empty()
}

fn seed_default_taxonomy(connection: &mut Connection) -> Result<(), ProjectServiceError> {
    let transaction = connection
        .transaction()
        .map_err(DatabaseError::FailedToStartTransaction)
        .map_err(InfrastructureError::from)?;

    for (name, description) in DEFAULT_CATEGORIES {
        transaction
            .execute(
                "INSERT INTO categories (name, description) VALUES (?1, ?2)",
                params![name, description],
            )
            .map_err(DatabaseError::FailedToInsertData)
            .map_err(InfrastructureError::from)?;
    }

    for (code, label, is_bound) in DEFAULT_MORPH_TYPES {
        transaction
            .execute(
                "INSERT INTO morph_types (code, label, is_bound) VALUES (?1, ?2, ?3)",
                params![code, label, is_bound],
            )
            .map_err(DatabaseError::FailedToInsertData)
            .map_err(InfrastructureError::from)?;
    }

    transaction
        .commit()
        .map_err(DatabaseError::FailedToCommitTransaction)
        .map_err(InfrastructureError::from)?;

    Ok(())
}

pub fn create_project(
    name: &str,
    description: Option<&str>,
    path: &Path,
    app_db: &mut Connection,
) -> Result<(ProjectDto, Connection), ProjectServiceError> {
    if is_string_blank(name) {
        return Err(ProjectServiceError::ProjectNameIsBlank);
    }

    let project_dir = infrastructure::projects::create_project_dir(path, name)?;

    let metadata = ProjectMetadata::new(String::from(name), description.map(String::from));

    infrastructure::projects::create_project_metadata_file(&project_dir, &metadata)?;

    let mut connection = infrastructure::projects::open_project_database(&project_dir)?;
    seed_default_taxonomy(&mut connection)?;

    let project_dto = ProjectDto {
        metadata: Some(metadata),
        project_dir: project_dir.to_string_lossy().to_string(),
    };

    let mut app_store = infrastructure::database::app::ProjectsListStore::new(app_db);
    app_store.add(project_dir.to_string_lossy().as_ref())?;

    Ok((project_dto, connection))
}

pub fn open_project(
    project_dir: &Path,
    app_db: &mut Connection,
) -> Result<(ProjectDto, Connection), ProjectServiceError> {
    let metadata_path = project_dir.join("metadata.json");

    let metadata = infrastructure::projects::open_project_metadata_file(&metadata_path)?;

    let connection = infrastructure::projects::open_project_database(project_dir)?;

    let project_dto = ProjectDto {
        metadata: Some(metadata),
        project_dir: project_dir.to_string_lossy().to_string(),
    };

    let mut app_store = infrastructure::database::app::ProjectsListStore::new(app_db);

    let check = app_store.get_by_path(project_dir.to_string_lossy().as_ref())?;

    if check.is_none() {
        app_store.add(project_dir.to_string_lossy().as_ref())?;
    }

    Ok((project_dto, connection))
}

pub fn update_project(
    project_dir: &Path,
    name: &str,
    description: Option<&str>,
) -> Result<ProjectDto, ProjectServiceError> {
    if is_string_blank(name) {
        return Err(ProjectServiceError::ProjectNameIsBlank);
    }

    let metadata_path = project_dir.join("metadata.json");
    let mut metadata = infrastructure::projects::open_project_metadata_file(&metadata_path)?;
    metadata.name = name.trim().to_string();
    metadata.description = description
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    infrastructure::projects::update_project_metadata_file(project_dir, &metadata)?;

    Ok(ProjectDto {
        metadata: Some(metadata),
        project_dir: project_dir.to_string_lossy().to_string(),
    })
}

pub fn remove_recent_project(
    path: &str,
    app_db: &mut Connection,
) -> Result<(), ProjectServiceError> {
    let mut store = infrastructure::database::app::ProjectsListStore::new(app_db);
    store.remove_by_path(path)?;
    Ok(())
}

pub fn delete_project(
    project_dir: &Path,
    app_db: &mut Connection,
) -> Result<(), ProjectServiceError> {
    infrastructure::projects::open_project_metadata_file(&project_dir.join("metadata.json"))?;
    let path = project_dir.to_string_lossy().to_string();
    remove_recent_project(&path, app_db)?;

    if let Err(error) = std::fs::remove_dir_all(project_dir) {
        let mut store = infrastructure::database::app::ProjectsListStore::new(app_db);
        if let Err(restore_error) = store.add(&path) {
            eprintln!("Failed to restore recent project after delete error: {restore_error}");
        }
        return Err(InfrastructureError::Io(error).into());
    }

    Ok(())
}

pub fn list_projects(app_db: &mut Connection) -> Result<Vec<ProjectDto>, ProjectServiceError> {
    let mut store = infrastructure::database::app::ProjectsListStore::new(app_db);
    let rows = store.list_all()?;
    let mut projects = Vec::with_capacity(rows.len());

    for row in rows {
        let project_dir = Path::new(&row.path);
        let metadata_path = project_dir.join("metadata.json");

        match infrastructure::projects::open_project_metadata_file(&metadata_path) {
            Ok(metadata) => projects.push(ProjectDto {
                metadata: Some(metadata),
                project_dir: project_dir.to_string_lossy().to_string(),
            }),
            Err(error) => {
                eprintln!(
                    "Removing unavailable project from recent list at {}: {error}",
                    row.path
                );
                store.remove(i64::from(row.id))?;
            }
        }
    }

    Ok(projects)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::{category, morph_type};

    fn app_db_connection() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        infrastructure::database::app::run_migrations(&mut conn).unwrap();
        conn
    }

    mod create_project {
        use super::*;

        #[test]
        fn with_valid_data() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let name = "test project";
            let description = Some("project description");

            let (dto, _) = create_project(name, description, temp_dir.path(), &mut app_db).unwrap();

            let project_dir = Path::new(&dto.project_dir);

            assert_eq!(project_dir, temp_dir.path().join(name));
            assert!(dto.metadata.is_some());

            let metadata = dto.metadata.unwrap();

            assert_eq!(metadata.name, name);
            assert_eq!(metadata.description.as_deref(), description);

            let mut connection =
                infrastructure::projects::open_project_database(project_dir).unwrap();
            let categories = category::list_categories(&mut connection).unwrap();
            assert_eq!(categories.len(), DEFAULT_CATEGORIES.len());
            for (name, description) in DEFAULT_CATEGORIES {
                let category = categories
                    .iter()
                    .find(|category| category.name().as_str() == name)
                    .unwrap();
                assert_eq!(category.description().as_deref(), Some(description));
            }

            let morph_types = morph_type::list_morph_types(&mut connection).unwrap();
            assert_eq!(morph_types.len(), DEFAULT_MORPH_TYPES.len());
            for (code, label, is_bound) in DEFAULT_MORPH_TYPES {
                let morph_type = morph_types
                    .iter()
                    .find(|morph_type| morph_type.code().as_str() == code)
                    .unwrap();
                assert_eq!(morph_type.label().as_str(), label);
                assert_eq!(morph_type.is_bound(), is_bound);
                assert!(code
                    .chars()
                    .all(|character| character.is_ascii_lowercase() || character == '-'));
            }
        }

        #[test]
        fn taxonomy_seed_rolls_back_when_an_insert_fails() {
            let mut connection = Connection::open_in_memory().unwrap();
            infrastructure::database::projects::run_migrations(&mut connection).unwrap();
            morph_type::create_morph_type(&mut connection, "stem", "Existing Stem", false).unwrap();

            assert!(seed_default_taxonomy(&mut connection).is_err());
            assert!(category::list_categories(&mut connection)
                .unwrap()
                .is_empty());

            let morph_types = morph_type::list_morph_types(&mut connection).unwrap();
            assert_eq!(morph_types.len(), 1);
            assert_eq!(morph_types[0].label().as_str(), "Existing Stem");
        }

        #[test]
        fn with_empty_name_returns_error() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let name = "";
            let description = Some("project description");

            let result = create_project(name, description, temp_dir.path(), &mut app_db);

            assert!(result.is_err());
        }

        #[test]
        fn with_blank_name_returns_error() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let name = "    \n";
            let description = Some("project description");

            let result = create_project(name, description, temp_dir.path(), &mut app_db);

            assert!(result.is_err());
        }

        #[test]
        fn with_non_existent_path_returns_error() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let name = "test project";
            let description = Some("project description");

            let invalid_path = temp_dir.path().join("non existent path");

            let result = create_project(name, description, &invalid_path, &mut app_db);

            assert!(result.is_err());
        }
    }

    mod open_project {
        use super::*;

        #[test]
        fn opening_existing_project_does_not_seed_taxonomy() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();
            let project_dir =
                infrastructure::projects::create_project_dir(temp_dir.path(), "existing").unwrap();
            let metadata = ProjectMetadata::new(String::from("existing"), None);
            infrastructure::projects::create_project_metadata_file(&project_dir, &metadata)
                .unwrap();

            let mut connection =
                infrastructure::projects::open_project_database(&project_dir).unwrap();
            category::create_category(&mut connection, "Custom", Some("Existing category"))
                .unwrap();
            drop(connection);

            let (_, mut connection) = open_project(&project_dir, &mut app_db).unwrap();

            let categories = category::list_categories(&mut connection).unwrap();
            assert_eq!(categories.len(), 1);
            assert_eq!(categories[0].name().as_str(), "Custom");
            assert!(morph_type::list_morph_types(&mut connection)
                .unwrap()
                .is_empty());
        }

        #[test]
        fn with_valid_path() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let name = "test project";
            let description = Some("project description");

            let (dto, _) = create_project(name, description, temp_dir.path(), &mut app_db).unwrap();

            let project_dir_path = Path::new(&dto.project_dir);

            let result = open_project(project_dir_path, &mut app_db);

            assert!(result.is_ok());

            let (opened_project_dto, _) = result.unwrap();

            assert_eq!(opened_project_dto.project_dir, dto.project_dir);
        }

        #[test]
        fn with_non_existent_project_dir_returns_error() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let invalid_project_dir = temp_dir.path().join("invalid_project_dir");

            let result = open_project(&invalid_project_dir, &mut app_db);

            assert!(result.is_err());
        }

        #[test]
        fn opening_project_at_new_location_removes_old_recent_path() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let (dto, connection) =
                create_project("moved project", None, temp_dir.path(), &mut app_db).unwrap();
            let old_path = Path::new(&dto.project_dir).to_path_buf();
            let new_path = temp_dir.path().join("relocated project");
            drop(connection);
            std::fs::rename(&old_path, &new_path).unwrap();

            let (_, connection) = open_project(&new_path, &mut app_db).unwrap();
            drop(connection);

            let projects = list_projects(&mut app_db).unwrap();
            assert_eq!(projects.len(), 1);
            assert_eq!(projects[0].project_dir, new_path.to_string_lossy());
        }
    }

    mod update_project {
        use super::*;

        #[test]
        fn updates_name_and_description_without_changing_creation_time() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();
            let (project, connection) = create_project(
                "before",
                Some("old description"),
                temp_dir.path(),
                &mut app_db,
            )
            .unwrap();
            drop(connection);
            let created_at = project.metadata.as_ref().unwrap().created_at;

            let updated = update_project(
                Path::new(&project.project_dir),
                " after ",
                Some(" new description "),
            )
            .unwrap();

            let metadata = updated.metadata.unwrap();
            assert_eq!(metadata.name, "after");
            assert_eq!(metadata.description.as_deref(), Some("new description"));
            assert_eq!(metadata.created_at, created_at);
            assert_eq!(
                infrastructure::projects::open_project_metadata_file(
                    &Path::new(&project.project_dir).join("metadata.json")
                )
                .unwrap()
                .name,
                "after"
            );
        }

        #[test]
        fn rejects_blank_name() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();
            let (project, connection) =
                create_project("project", None, temp_dir.path(), &mut app_db).unwrap();
            drop(connection);

            assert!(update_project(Path::new(&project.project_dir), "  ", None).is_err());
        }
    }

    mod delete_project {
        use super::*;

        #[test]
        fn permanently_deletes_project_directory_and_recent_reference() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();
            let (project, connection) =
                create_project("to delete", None, temp_dir.path(), &mut app_db).unwrap();
            let project_dir = Path::new(&project.project_dir).to_path_buf();
            drop(connection);

            delete_project(&project_dir, &mut app_db).unwrap();

            assert!(!project_dir.exists());
            assert!(list_projects(&mut app_db).unwrap().is_empty());
        }
    }

    mod recent_project {
        use super::*;

        #[test]
        fn removing_from_recent_keeps_project_directory() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();
            let (project, connection) =
                create_project("keep files", None, temp_dir.path(), &mut app_db).unwrap();
            let project_dir = Path::new(&project.project_dir).to_path_buf();
            drop(connection);

            remove_recent_project(&project.project_dir, &mut app_db).unwrap();

            assert!(project_dir.exists());
            assert!(list_projects(&mut app_db).unwrap().is_empty());
        }
    }

    mod list_projects {
        use super::*;

        struct list_project {
            pub name: String,
            pub description: Option<String>,
        }

        #[test]
        fn with_created_projects() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let projects_data = vec![
                list_project {
                    name: String::from("project 1"),
                    description: Some(String::from("project description")),
                },
                list_project {
                    name: String::from("project 2"),
                    description: None,
                },
            ];

            for data in &projects_data {
                create_project(
                    &data.name,
                    data.description.as_deref(),
                    temp_dir.path(),
                    &mut app_db,
                )
                .unwrap();
            }

            let result = list_projects(&mut app_db);
            assert!(result.is_ok());

            let projects = result.unwrap();

            assert_eq!(projects.len(), projects_data.len());
        }

        #[test]
        fn with_no_created_projects_returns_empty_vector() {
            let mut app_db = app_db_connection();

            let result = list_projects(&mut app_db);

            assert!(result.is_ok());

            let projects = result.unwrap();

            assert_eq!(projects.len(), 0);
        }

        #[test]
        fn removes_unavailable_projects_without_failing_the_list() {
            let temp_dir = tempfile::tempdir().unwrap();
            let mut app_db = app_db_connection();

            let (valid_project, connection) =
                create_project("valid project", None, temp_dir.path(), &mut app_db).unwrap();
            drop(connection);

            let missing_path = temp_dir.path().join("deleted project");
            let invalid_metadata_path = temp_dir.path().join("invalid metadata project");
            std::fs::create_dir(&invalid_metadata_path).unwrap();
            std::fs::write(invalid_metadata_path.join("metadata.json"), "{").unwrap();

            let mut store = infrastructure::database::app::ProjectsListStore::new(&mut app_db);
            store.add(missing_path.to_string_lossy().as_ref()).unwrap();
            store
                .add(invalid_metadata_path.to_string_lossy().as_ref())
                .unwrap();

            let projects = list_projects(&mut app_db).unwrap();

            assert_eq!(projects.len(), 1);
            assert_eq!(projects[0].project_dir, valid_project.project_dir);

            let remaining_rows = infrastructure::database::app::ProjectsListStore::new(&mut app_db)
                .list_all()
                .unwrap();
            assert_eq!(remaining_rows.len(), 1);
            assert_eq!(remaining_rows[0].path, valid_project.project_dir);
        }
    }
}
