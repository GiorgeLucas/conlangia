use std::fs;

use tauri::Manager;

use crate::state::AppState;

mod commands;
mod infrastructure;
mod models;
mod services;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;

            fs::create_dir_all(&app_data_dir)?;

            let app_db = app_data_dir.join("app.db");

            let mut app_db_connection = infrastructure::database::open_connection(&app_db)?;

            infrastructure::database::app::run_migrations(&mut app_db_connection)?;

            app.manage(AppState::new(app_db_connection));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::projects::create_project,
            commands::projects::open_project,
            commands::projects::list_projects,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
