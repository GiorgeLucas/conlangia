CREATE TABLE IF NOT EXISTS categories (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS morph_types (
    id INTEGER NOT NULL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_bound BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
    id INTEGER NOT NULL PRIMARY KEY,
    entry_form TEXT NOT NULL,
    morph_type_id INTEGER,
    FOREIGN KEY (morph_type_id) REFERENCES morph_types (id)
);

CREATE TABLE IF NOT EXISTS pronunciations (
    id INTEGER NOT NULL PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL,
    entry_id INTEGER NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE,
    UNIQUE (entry_id, sort_order)
);

CREATE TABLE IF NOT EXISTS senses (
    id INTEGER NOT NULL PRIMARY KEY,
    translation TEXT NOT NULL,
    definition TEXT,
    sort_order INTEGER NOT NULL,
    entry_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    UNIQUE (entry_id, sort_order)
);
