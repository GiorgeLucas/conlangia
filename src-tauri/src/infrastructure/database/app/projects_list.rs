use chrono::{SecondsFormat, Utc};
use rusqlite::{params, Connection, OptionalExtension};

use crate::infrastructure::{database::DatabaseError, InfrastructureError};

fn current_timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Nanos, true)
}

pub struct ProjectsListRow {
    pub id: i32,
    pub path: String,
    #[allow(dead_code)]
    pub last_opened_at: Option<String>,
}

pub struct ProjectsListStore<'a> {
    pub connection: &'a mut Connection,
}
impl<'a> ProjectsListStore<'a> {
    pub fn new(connection: &'a mut Connection) -> Self {
        Self { connection }
    }

    pub fn add(&mut self, path: &str) -> Result<i64, InfrastructureError> {
        let last_opened_at = current_timestamp();

        let mut stmt = self
            .connection
            .prepare("INSERT INTO projects_list (path, last_opened_at) VALUES (?1, ?2)")
            .map_err(DatabaseError::FailedToInsertData)?;

        let row_id = stmt
            .insert(params![path, last_opened_at])
            .map_err(DatabaseError::FailedToInsertData)?;

        Ok(row_id)
    }

    pub fn mark_opened(&mut self, path: &str) -> Result<(), InfrastructureError> {
        self.connection
            .execute(
                "UPDATE projects_list SET last_opened_at = ?1 WHERE path = ?2",
                params![current_timestamp(), path],
            )
            .map_err(DatabaseError::FailedToUpdateData)?;

        Ok(())
    }

    pub fn remove(&mut self, id: i64) -> Result<(), InfrastructureError> {
        self.connection
            .execute("DELETE FROM projects_list WHERE id = ?1", params![id])
            .map_err(DatabaseError::FailedToDeleteData)?;

        Ok(())
    }

    pub fn remove_by_path(&mut self, path: &str) -> Result<(), InfrastructureError> {
        self.connection
            .execute("DELETE FROM projects_list WHERE path = ?1", params![path])
            .map_err(DatabaseError::FailedToDeleteData)?;

        Ok(())
    }

    #[allow(dead_code)]
    pub fn get(&mut self, id: i64) -> Result<Option<ProjectsListRow>, InfrastructureError> {
        let result = self
            .connection
            .query_row(
                "SELECT id, path, last_opened_at
             FROM projects_list
             WHERE id = ?1",
                [id],
                |row| {
                    Ok(ProjectsListRow {
                        id: row.get(0)?,
                        path: row.get(1)?,
                        last_opened_at: row.get(2)?,
                    })
                },
            )
            .optional()
            .map_err(DatabaseError::FailedToQueryData)?;

        Ok(result)
    }

    pub fn get_by_path(
        &mut self,
        path: &str,
    ) -> Result<Option<ProjectsListRow>, InfrastructureError> {
        let result = self
            .connection
            .query_row(
                "SELECT id, path, last_opened_at
             FROM projects_list
             WHERE path = ?1",
                [path],
                |row| {
                    Ok(ProjectsListRow {
                        id: row.get(0)?,
                        path: row.get(1)?,
                        last_opened_at: row.get(2)?,
                    })
                },
            )
            .optional()
            .map_err(DatabaseError::FailedToQueryData)?;

        Ok(result)
    }

    pub fn list_all(&mut self) -> Result<Vec<ProjectsListRow>, InfrastructureError> {
        let mut stmt = self
            .connection
            .prepare(
                "SELECT id, path, last_opened_at
                 FROM projects_list
                 ORDER BY last_opened_at DESC, id DESC",
            )
            .map_err(DatabaseError::FailedToQueryData)?;

        let rows = stmt
            .query_map([], |row| {
                Ok(ProjectsListRow {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    last_opened_at: row.get(2)?,
                })
            })
            .map_err(DatabaseError::FailedToQueryData)?;

        let result = rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(DatabaseError::FailedToQueryData)?;

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use crate::infrastructure;

    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_projects_list_store() {
        let mut conn = Connection::open_in_memory().unwrap();

        infrastructure::database::app::run_migrations(&mut conn).unwrap();

        let mut store = ProjectsListStore::new(&mut conn);

        let project_id = store.add("path/to/project").unwrap();

        let fetched_project = store.get(project_id).unwrap().unwrap();
        assert_eq!(fetched_project.path, "path/to/project");
        assert!(fetched_project.last_opened_at.is_some());

        let all_projects = store.list_all().unwrap();
        assert_eq!(all_projects.len(), 1);

        store.remove(project_id).unwrap();
        let fetched_project_after_removal = store.get(project_id).unwrap();
        assert!(fetched_project_after_removal.is_none());
    }

    #[test]
    fn list_all_orders_projects_by_last_opened_at() {
        let mut conn = Connection::open_in_memory().unwrap();
        infrastructure::database::app::run_migrations(&mut conn).unwrap();
        let mut store = ProjectsListStore::new(&mut conn);

        store.add("older project").unwrap();
        store.add("newer project").unwrap();
        store
            .connection
            .execute(
                "UPDATE projects_list SET last_opened_at = ?1 WHERE path = ?2",
                params!["2026-01-01T10:00:00.000000000Z", "older project"],
            )
            .unwrap();
        store
            .connection
            .execute(
                "UPDATE projects_list SET last_opened_at = ?1 WHERE path = ?2",
                params!["2026-01-02T10:00:00.000000000Z", "newer project"],
            )
            .unwrap();

        let projects = store.list_all().unwrap();
        assert_eq!(projects[0].path, "newer project");
        assert_eq!(projects[1].path, "older project");
    }
}
