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
            commands::project::create_project,
            commands::project::open_project,
            commands::project::list_projects,

            commands::entry::create_entry,
            commands::entry::list_entries,
            commands::entry::update_entry_form,
            commands::entry::update_entry_morph_type,
            commands::entry::add_entry_pronunciation,
            commands::entry::update_entry_pronunciation_value,
            commands::entry::update_entry_pronunciation_description,
            commands::entry::move_entry_pronunciation,
            commands::entry::remove_entry_pronunciation,
            commands::entry::add_entry_sense,
            commands::entry::update_entry_sense_translation,
            commands::entry::update_entry_sense_definition,
            commands::entry::update_entry_sense_category,
            commands::entry::move_entry_sense,
            commands::entry::remove_entry_sense,

            commands::category::create_category,
            commands::category::list_categories,
            commands::category::update_category_name,
            commands::category::update_category_description,
            commands::category::delete_category,

            commands::morph_type::create_morph_type,
            commands::morph_type::list_morph_types,
            commands::morph_type::update_morph_type_code,
            commands::morph_type::update_morph_type_label,
            commands::morph_type::update_morph_type_bound,
            commands::morph_type::delete_morph_type,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
