use std::{
    fs,
    path::{Path, PathBuf},
};

use rusqlite::Connection;

use crate::{
    infrastructure::{
        database::{open_connection, projects::run_migrations},
        InfrastructureError,
    },
    models::project::ProjectMetadata,
};

pub fn create_project_dir(path: &Path, project_name: &str) -> Result<PathBuf, InfrastructureError> {
    let project_dir = path.join(project_name);

    fs::create_dir(&project_dir)?;

    Ok(project_dir)
}

pub fn create_project_metadata_file(
    project_dir: &Path,
    metadata: &ProjectMetadata,
) -> Result<PathBuf, InfrastructureError> {
    let metadata_json = serde_json::to_string_pretty(metadata)?;

    let metadata_file = project_dir.join("metadata.json");

    fs::write(&metadata_file, metadata_json)?;

    Ok(metadata_file)
}

pub fn open_project_metadata_file(
    metadata_path: &Path,
) -> Result<ProjectMetadata, InfrastructureError> {
    let metadata_json = fs::read_to_string(metadata_path)?;

    let metadata: ProjectMetadata = serde_json::from_str(&metadata_json)?;

    Ok(metadata)
}

pub fn open_project_database(project_dir: &Path) -> Result<Connection, InfrastructureError> {
    let db_path = project_dir.join("data.db");

    let mut connection = open_connection(&db_path)?;

    run_migrations(&mut connection)?;

    Ok(connection)
}
