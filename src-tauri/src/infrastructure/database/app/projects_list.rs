use rusqlite::{params, Connection, OptionalExtension};

use crate::infrastructure::{database::DatabaseError, InfrastructureError};

pub struct ProjectsListRow {
    pub id: i32,
    pub path: String,
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
        let last_opened_at: Option<String> = None;

        let mut stmt = self
            .connection
            .prepare("INSERT INTO projects_list (path, last_opened_at) VALUES (?1, ?2)")
            .map_err(DatabaseError::FailedToInsertData)?;

        let row_id = stmt
            .insert(params![path, last_opened_at])
            .map_err(DatabaseError::FailedToInsertData)?;

        Ok(row_id)
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
            .prepare("SELECT id, path, last_opened_at FROM projects_list")
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

        let all_projects = store.list_all().unwrap();
        assert_eq!(all_projects.len(), 1);

        store.remove(project_id).unwrap();
        let fetched_project_after_removal = store.get(project_id).unwrap();
        assert!(fetched_project_after_removal.is_none());
    }
}
