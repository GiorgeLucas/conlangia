use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}
impl ProjectMetadata {
    pub fn new(name: String, description: Option<String>) -> Self {
        Self {
            name,
            description,
            created_at: Utc::now(),
        }
    }
}
