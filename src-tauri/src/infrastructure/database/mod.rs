pub mod app;
pub mod connection;
pub mod projects;
pub use connection::open_connection;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("failed to open connection: {0}")]
    FailedToOpenConnection(#[source] rusqlite::Error),

    #[error("failed to enable foreign keys: {0}")]
    FailedToEnableForeignKeys(#[source] rusqlite::Error),

    #[error("failed to start transaction: {0}")]
    FailedToStartTransaction(#[source] rusqlite::Error),

    #[error("failed to commit transaction: {0}")]
    FailedToCommitTransaction(#[source] rusqlite::Error),

    #[error("failed to insert data: {0}")]
    FailedToInsertData(#[source] rusqlite::Error),

    #[error("failed to query data: {0}")]
    FailedToQueryData(#[source] rusqlite::Error),

    #[error("failed to update data: {0}")]
    FailedToUpdateData(#[source] rusqlite::Error),

    #[error("failed to delete data: {0}")]
    FailedToDeleteData(#[source] rusqlite::Error),

    #[error("failed to run migrations: {0}")]
    FailedToRunMigrations(#[source] refinery::Error),

    #[error("stored data is invalid")]
    InvalidStoredData,

    #[error("data not found")]
    NotFound,
}
