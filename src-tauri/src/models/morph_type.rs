use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum MorphTypeError {
    #[error("code is empty")]
    CodeIsEmpty,
    #[error("label is empty")]
    LabelIsEmpty,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MorphTypeId(i64);
impl MorphTypeId {
    pub fn new(id: i64) -> Self {
        Self(id)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MorphTypeCode(String);
impl MorphTypeCode {
    pub fn new(value: impl AsRef<str>) -> Result<Self, MorphTypeError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(MorphTypeError::CodeIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MorphTypeLabel(String);
impl MorphTypeLabel {
    pub fn new(value: impl AsRef<str>) -> Result<Self, MorphTypeError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(MorphTypeError::LabelIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MorphType {
    id: Option<MorphTypeId>,
    code: MorphTypeCode,
    label: MorphTypeLabel,
    is_bound: bool,
}
impl MorphType {
    pub fn new(code: MorphTypeCode, label: MorphTypeLabel, is_bound: bool) -> Self {
        Self {
            id: None,
            code,
            label,
            is_bound,
        }
    }
    pub fn from_existing(
        id: MorphTypeId,
        code: MorphTypeCode,
        label: MorphTypeLabel,
        is_bound: bool,
    ) -> Self {
        Self {
            id: Some(id),
            code,
            label,
            is_bound,
        }
    }
    pub fn id(&self) -> Option<MorphTypeId> {
        self.id
    }
    pub fn code(&self) -> &MorphTypeCode {
        &self.code
    }
    pub fn label(&self) -> &MorphTypeLabel {
        &self.label
    }
    pub fn is_bound(&self) -> bool {
        self.is_bound
    }
    pub fn set_code(&mut self, code: MorphTypeCode) {
        self.code = code;
    }
    pub fn set_label(&mut self, label: MorphTypeLabel) {
        self.label = label;
    }
    pub fn set_bound(&mut self, is_bound: bool) {
        self.is_bound = is_bound;
    }
}
