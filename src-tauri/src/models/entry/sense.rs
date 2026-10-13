use thiserror::Error;

use crate::models::category::CategoryId;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SenseError {
    #[error("translation is empty")]
    TranslationIsEmpty,
    #[error("sort order must be positive")]
    SortOrderMustBePositive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SenseId(i64);
impl SenseId {
    pub fn new(id: i64) -> Self {
        Self(id)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SenseTranslation(String);
impl SenseTranslation {
    pub fn new(value: impl AsRef<str>) -> Result<Self, SenseError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(SenseError::TranslationIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct SenseDefinition(Option<String>);
impl SenseDefinition {
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SenseSortOrder(i64);
impl SenseSortOrder {
    pub fn new(value: i64) -> Result<Self, SenseError> {
        if value <= 0 {
            return Err(SenseError::SortOrderMustBePositive);
        }
        Ok(Self(value))
    }
    pub(super) fn from_position(position: usize) -> Self {
        Self(position as i64 + 1)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sense {
    id: Option<SenseId>,
    translation: SenseTranslation,
    definition: SenseDefinition,
    sort_order: SenseSortOrder,
    category_id: Option<CategoryId>,
}
impl Sense {
    pub(super) fn new(
        translation: SenseTranslation,
        definition: SenseDefinition,
        sort_order: SenseSortOrder,
        category_id: Option<CategoryId>,
    ) -> Self {
        Self {
            id: None,
            translation,
            definition,
            sort_order,
            category_id,
        }
    }
    pub fn from_existing(
        id: SenseId,
        translation: SenseTranslation,
        definition: SenseDefinition,
        sort_order: SenseSortOrder,
        category_id: Option<CategoryId>,
    ) -> Self {
        Self {
            id: Some(id),
            translation,
            definition,
            sort_order,
            category_id,
        }
    }
    pub fn id(&self) -> Option<SenseId> {
        self.id
    }
    pub fn translation(&self) -> &SenseTranslation {
        &self.translation
    }
    pub fn definition(&self) -> &SenseDefinition {
        &self.definition
    }
    pub fn sort_order(&self) -> SenseSortOrder {
        self.sort_order
    }
    pub fn category_id(&self) -> Option<CategoryId> {
        self.category_id
    }
    pub(super) fn set_translation(&mut self, translation: SenseTranslation) {
        self.translation = translation;
    }
    pub(super) fn set_definition(&mut self, definition: SenseDefinition) {
        self.definition = definition;
    }
    pub(super) fn set_sort_order(&mut self, sort_order: SenseSortOrder) {
        self.sort_order = sort_order;
    }
    pub(super) fn set_category(&mut self, category_id: Option<CategoryId>) {
        self.category_id = category_id;
    }
}
