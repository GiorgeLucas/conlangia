<div align="center">
  <img src="public/assets/logo.svg" alt="Conlangia logo" width="88" />

  <h1>Conlangia</h1>
  <p><strong>Shape your language from its first word to a living lexicon.</strong></p>
  <p>A desktop workspace for building and organizing constructed languages.</p>
</div>

Conlangia brings the building blocks of a constructed language together: its words, pronunciations, meanings, categories, and morphology. Each project is stored locally in a folder you choose, so your language data stays under your control.

## Features

- **Project management** — create, open, rename, and organize language projects.
- **Lexicon** — create entries individually or in bulk, search and sort words, and manage pronunciations and senses.
- **Bulk actions** — assign morphology types to multiple entries or delete selected entries.
- **Pronunciations and senses** — add descriptions, definitions, and categories; reorder items with drag and drop.
- **Categories and morphology** — define and manage parts of speech and morphology types, including bound/free forms.
- **Local project files** — keep each project's data in its own folder and switch between light and dark themes.

New projects start with common categories and morphology types, which can be edited to suit your language.

## Get started

### Download and run

Download a release for your platform from [GitHub Releases](https://github.com/GiorgeLucas/conlangia/releases). If no release is available for your platform, build the app from source.

### Build from source

#### Prerequisites

- [Node.js](https://nodejs.org/) compatible with Vite 8
- [pnpm](https://pnpm.io/installation)
- [Rust](https://www.rust-lang.org/tools/install) and Cargo
- The [Tauri v2 platform prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system

#### Run the desktop app in development

```bash
git clone https://github.com/GiorgeLucas/conlangia.git
cd conlangia
pnpm install
pnpm tauri dev
```

#### Build

Build the frontend:

```bash
pnpm build
```

Build a desktop bundle for the current platform:

```bash
pnpm tauri build
```

#### Run backend tests

The Rust tests are defined in the Tauri crate:

```bash
cd src-tauri
cargo test
```

## Project data

When you create a project, Conlangia creates a folder named after the project inside the location you choose. It contains:

| File | Purpose |
| --- | --- |
| `metadata.json` | Project name, description, and creation date |
| `data.db` | SQLite database containing the project's lexicon and taxonomy |

The list of recent projects is stored separately in the app's local data directory. Deleting a project from Settings permanently removes its project folder and its contents.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, and Base UI
- **Desktop:** Tauri 2 and Rust
- **Storage:** SQLite, managed with Rust

## Project structure

```text
src/
├── app/        # Application setup, navigation, and workspace layout
├── features/   # Project, lexicon, categories, and morphology domains
├── shared/     # Reusable UI, contexts, hooks, and styles
└── main.tsx    # Frontend entry point

src-tauri/
└── src/
    ├── commands/       # Tauri commands exposed to the frontend
    ├── infrastructure/ # SQLite, migrations, and project files
    ├── models/         # Domain models
    └── services/       # Application operations
```

## Useful links

- [Source code](https://github.com/GiorgeLucas/conlangia)
- [Report an issue](https://github.com/GiorgeLucas/conlangia/issues)
