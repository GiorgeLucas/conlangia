use thiserror::Error;

use crate::infrastructure::database::DatabaseError;

pub mod database;
pub mod projects;

#[derive(Debug, Error)]
pub enum InfrastructureError {
    #[error(transparent)]
    Database(#[from] DatabaseError),

    #[error("failed to serialize/deserialize data: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("filesystem error: {0}")]
    Io(#[from] std::io::Error),

    #[error("directory does not exist")]
    DirectoryDoesntExist,

    #[error("file does not exist")]
    FileDoesntExist,
}
