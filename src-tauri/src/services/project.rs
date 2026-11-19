use std::path::Path;

use rusqlite::Connection;
use thiserror::Error;

use crate::{
    commands::project::ProjectDto,
    infrastructure::{self, InfrastructureError},
    models::project::ProjectMetadata,
};

#[derive(Debug, Error)]
pub enum ProjectServiceError {
    #[error(transparent)]
    InfrastructureError(#[from] InfrastructureError),

    #[error("project name cannot be blank")]
    ProjectNameIsBlank,
}

fn is_string_blank(value: &str) -> bool {
    value.trim().is_empty()
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

    let connection = infrastructure::projects::open_project_database(&project_dir)?;

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
