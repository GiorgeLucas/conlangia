CREATE TABLE IF NOT EXISTS projects_list (
    id INTEGER NOT NULL PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    last_opened_at TEXT
);
