pub mod projects_list;
pub use projects_list::{ProjectsListRow, ProjectsListStore};
use rusqlite::Connection;

use crate::infrastructure::database::DatabaseError;

mod embedded {
    refinery::embed_migrations!("src/infrastructure/database/app/migrations");
}

pub fn run_migrations(conn: &mut Connection) -> Result<(), DatabaseError> {
    embedded::migrations::runner()
        .run(conn)
        .map_err(DatabaseError::FailedToRunMigrations)?;
    Ok(())
}
