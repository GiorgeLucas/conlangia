use std::path::Path;

use rusqlite::Connection;

use crate::infrastructure::database::DatabaseError;

pub fn open_connection(db_path: &Path) -> Result<Connection, DatabaseError> {
    let conn = Connection::open(db_path).map_err(DatabaseError::FailedToOpenConnection)?;

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(DatabaseError::FailedToEnableForeignKeys)?;

    Ok(conn)
}
