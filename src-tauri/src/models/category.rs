use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum CategoryError {
    #[error("category name is empty")]
    NameIsEmpty,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CategoryId(i64);
impl CategoryId {
    pub fn new(id: i64) -> Self {
        Self(id)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CategoryName(String);
impl CategoryName {
    pub fn new(value: impl AsRef<str>) -> Result<Self, CategoryError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(CategoryError::NameIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CategoryDescription(Option<String>);
impl CategoryDescription {
    pub fn new(value: Option<impl AsRef<str>>) -> Self {
        let value = value.map(|v| v.as_ref().trim().to_owned());
        let value = match value {
            Some(v) if v.is_empty() => None,
            Some(v) => Some(v),
            None => None,
        };
        Self(value)
    }
    pub fn as_deref(&self) -> Option<&str> {
        self.0.as_deref()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Category {
    id: Option<CategoryId>,
    name: CategoryName,
    description: CategoryDescription,
}
impl Category {
    pub fn new(name: CategoryName, description: CategoryDescription) -> Self {
        Self {
            id: None,
            name,
            description,
        }
    }
    pub fn from_existing(
        id: CategoryId,
        name: CategoryName,
        description: CategoryDescription,
    ) -> Self {
        Self {
            id: Some(id),
            name,
            description,
        }
    }
    pub fn id(&self) -> Option<CategoryId> {
        self.id
    }
    pub fn name(&self) -> &CategoryName {
        &self.name
    }
    pub fn description(&self) -> &CategoryDescription {
        &self.description
    }
    pub fn set_name(&mut self, name: CategoryName) {
        self.name = name;
    }
    pub fn set_description(&mut self, description: CategoryDescription) {
        self.description = description;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_blank_name() {
        assert_eq!(
            CategoryName::new("   ").unwrap_err(),
            CategoryError::NameIsEmpty
        );
    }

    #[test]
    fn trims_name() {
        assert_eq!(CategoryName::new("  casa ").unwrap().as_str(), "casa");
    }

    #[test]
    fn blank_description_becomes_none() {
        let d = CategoryDescription::new(Some("   ".to_string()));
        assert_eq!(d.as_deref(), None);
    }
}
