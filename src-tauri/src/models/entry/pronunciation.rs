use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PronunciationError {
    #[error("value is empty")]
    ValueIsEmpty,
    #[error("sort order must be positive")]
    SortOrderMustBePositive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PronunciationId(i64);
impl PronunciationId {
    pub fn new(id: i64) -> Self {
        Self(id)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PronunciationValue(String);
impl PronunciationValue {
    pub fn new(value: impl AsRef<str>) -> Result<Self, PronunciationError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(PronunciationError::ValueIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct PronunciationDescription(Option<String>);
impl PronunciationDescription {
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
pub struct PronunciationSortOrder(i64);
impl PronunciationSortOrder {
    pub fn new(value: i64) -> Result<Self, PronunciationError> {
        if value <= 0 {
            return Err(PronunciationError::SortOrderMustBePositive);
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
pub struct Pronunciation {
    id: Option<PronunciationId>,
    value: PronunciationValue,
    description: PronunciationDescription,
    sort_order: PronunciationSortOrder,
}
impl Pronunciation {
    pub(super) fn new(
        value: PronunciationValue,
        description: PronunciationDescription,
        sort_order: PronunciationSortOrder,
    ) -> Self {
        Self {
            id: None,
            value,
            description,
            sort_order,
        }
    }
    pub fn from_existing(
        id: PronunciationId,
        value: PronunciationValue,
        description: PronunciationDescription,
        sort_order: PronunciationSortOrder,
    ) -> Self {
        Self {
            id: Some(id),
            value,
            description,
            sort_order,
        }
    }
    pub fn id(&self) -> Option<PronunciationId> {
        self.id
    }
    pub fn value(&self) -> &PronunciationValue {
        &self.value
    }
    pub fn description(&self) -> &PronunciationDescription {
        &self.description
    }
    pub fn sort_order(&self) -> PronunciationSortOrder {
        self.sort_order
    }
    pub(super) fn set_value(&mut self, value: PronunciationValue) {
        self.value = value;
    }
    pub(super) fn set_description(&mut self, description: PronunciationDescription) {
        self.description = description;
    }
    pub(super) fn set_sort_order(&mut self, sort_order: PronunciationSortOrder) {
        self.sort_order = sort_order;
    }
}
