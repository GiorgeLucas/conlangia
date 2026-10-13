pub mod pronunciation;
pub mod sense;

use thiserror::Error;

use crate::models::{
    category::CategoryId,
    entry::{
        pronunciation::{
            Pronunciation, PronunciationDescription, PronunciationError, PronunciationId,
            PronunciationSortOrder, PronunciationValue,
        },
        sense::{Sense, SenseDefinition, SenseError, SenseId, SenseSortOrder, SenseTranslation},
    },
    morph_type::MorphTypeId,
};

#[derive(Debug, Error, PartialEq, Eq)]
pub enum EntryError {
    #[error("entry form is empty")]
    FormIsEmpty,
    #[error("pronunciation: {0}")]
    PronunciationError(#[from] PronunciationError),
    #[error("pronunciation was not found in the entry")]
    PronunciationNotFound,
    #[error("sense: {0}")]
    SenseError(#[from] SenseError),
    #[error("sense was not found in the entry")]
    SenseNotFound,
    #[error("position is out of range")]
    PositionOutOfRange,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EntryId(i64);
impl EntryId {
    pub fn new(id: i64) -> Self {
        Self(id)
    }
    pub fn get(self) -> i64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryForm(String);
impl EntryForm {
    pub fn new(value: impl AsRef<str>) -> Result<Self, EntryError> {
        let value = value.as_ref().trim();
        if value.is_empty() {
            return Err(EntryError::FormIsEmpty);
        }
        Ok(Self(value.to_owned()))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entry {
    id: Option<EntryId>,
    entry_form: EntryForm,
    pronunciations: Vec<Pronunciation>,
    senses: Vec<Sense>,
    morph_type_id: Option<MorphTypeId>,
}
impl Entry {
    pub fn new(entry_form: EntryForm) -> Self {
        Self {
            id: None,
            entry_form,
            pronunciations: Vec::new(),
            senses: Vec::new(),
            morph_type_id: None,
        }
    }
    pub fn from_existing(
        id: EntryId,
        entry_form: EntryForm,
        pronunciations: Vec<Pronunciation>,
        senses: Vec<Sense>,
        morph_type_id: Option<MorphTypeId>,
    ) -> Self {
        let mut entry = Self {
            id: Some(id),
            entry_form,
            pronunciations,
            senses,
            morph_type_id,
        };
        entry.pronunciations.sort_by_key(|p| p.sort_order().get());
        entry.senses.sort_by_key(|s| s.sort_order().get());
        entry.renumber_pronunciations();
        entry.renumber_senses();
        entry
    }
    pub fn id(&self) -> Option<EntryId> {
        self.id
    }
    pub fn form(&self) -> &EntryForm {
        &self.entry_form
    }
    pub fn pronunciations(&self) -> &[Pronunciation] {
        &self.pronunciations
    }
    pub fn senses(&self) -> &[Sense] {
        &self.senses
    }
    pub fn morph_type_id(&self) -> Option<MorphTypeId> {
        self.morph_type_id
    }
    pub fn set_entry_form(&mut self, entry_form: EntryForm) {
        self.entry_form = entry_form;
    }
    pub fn set_morph_type_id(&mut self, id: Option<MorphTypeId>) {
        self.morph_type_id = id;
    }
    pub fn add_pronunciation(
        &mut self,
        value: PronunciationValue,
        description: PronunciationDescription,
    ) {
        let sort_order = PronunciationSortOrder::from_position(self.pronunciations.len());
        self.pronunciations
            .push(Pronunciation::new(value, description, sort_order));
    }
    fn pronunciation_mut(&mut self, id: PronunciationId) -> Result<&mut Pronunciation, EntryError> {
        self.pronunciations
            .iter_mut()
            .find(|p| p.id() == Some(id))
            .ok_or(EntryError::PronunciationNotFound)
    }
    pub fn update_pronunciation_value(
        &mut self,
        id: PronunciationId,
        value: PronunciationValue,
    ) -> Result<(), EntryError> {
        self.pronunciation_mut(id)?.set_value(value);
        Ok(())
    }
    pub fn update_pronunciation_description(
        &mut self,
        id: PronunciationId,
        description: PronunciationDescription,
    ) -> Result<(), EntryError> {
        self.pronunciation_mut(id)?.set_description(description);
        Ok(())
    }
    pub fn move_pronunciation(
        &mut self,
        id: PronunciationId,
        to: PronunciationSortOrder,
    ) -> Result<(), EntryError> {
        let to_index = (to.get() - 1) as usize;
        if to_index >= self.pronunciations.len() {
            return Err(EntryError::PositionOutOfRange);
        }

        let from_index = self
            .pronunciations
            .iter()
            .position(|p| p.id() == Some(id))
            .ok_or(EntryError::PronunciationNotFound)?;

        let pronunciation = self.pronunciations.remove(from_index);
        self.pronunciations.insert(to_index, pronunciation);
        self.renumber_pronunciations();

        Ok(())
    }
    pub fn remove_pronunciation(&mut self, id: PronunciationId) -> Result<(), EntryError> {
        let index = self
            .pronunciations
            .iter()
            .position(|p| p.id() == Some(id))
            .ok_or(EntryError::PronunciationNotFound)?;

        self.pronunciations.remove(index);
        self.renumber_pronunciations();

        Ok(())
    }
    fn renumber_pronunciations(&mut self) {
        for (i, p) in self.pronunciations.iter_mut().enumerate() {
            p.set_sort_order(PronunciationSortOrder::from_position(i));
        }
    }
    pub fn add_sense(
        &mut self,
        translation: SenseTranslation,
        definition: SenseDefinition,
        category_id: Option<CategoryId>,
    ) {
        let sort_order = SenseSortOrder::from_position(self.senses.len());
        self.senses
            .push(Sense::new(translation, definition, sort_order, category_id));
    }
    fn sense_mut(&mut self, id: SenseId) -> Result<&mut Sense, EntryError> {
        self.senses
            .iter_mut()
            .find(|s| s.id() == Some(id))
            .ok_or(EntryError::SenseNotFound)
    }
    pub fn update_sense_translation(
        &mut self,
        id: SenseId,
        translation: SenseTranslation,
    ) -> Result<(), EntryError> {
        self.sense_mut(id)?.set_translation(translation);
        Ok(())
    }
    pub fn update_sense_definition(
        &mut self,
        id: SenseId,
        definition: SenseDefinition,
    ) -> Result<(), EntryError> {
        self.sense_mut(id)?.set_definition(definition);
        Ok(())
    }
    pub fn update_sense_category(
        &mut self,
        id: SenseId,
        category_id: Option<CategoryId>,
    ) -> Result<(), EntryError> {
        self.sense_mut(id)?.set_category(category_id);
        Ok(())
    }
    pub fn move_sense(&mut self, id: SenseId, to: SenseSortOrder) -> Result<(), EntryError> {
        let to_index = (to.get() - 1) as usize; // seguro: get() >= 1
        if to_index >= self.senses.len() {
            return Err(EntryError::PositionOutOfRange);
        }

        let from_index = self
            .senses
            .iter()
            .position(|s| s.id() == Some(id))
            .ok_or(EntryError::SenseNotFound)?;

        let sense = self.senses.remove(from_index);
        self.senses.insert(to_index, sense);
        self.renumber_senses();

        Ok(())
    }
    pub fn remove_sense(&mut self, sense_id: SenseId) -> Result<(), EntryError> {
        let index = self
            .senses
            .iter()
            .position(|sense| sense.id() == Some(sense_id))
            .ok_or(EntryError::SenseNotFound)?;

        self.senses.remove(index);
        self.renumber_senses();

        Ok(())
    }
    fn renumber_senses(&mut self) {
        for (i, s) in self.senses.iter_mut().enumerate() {
            s.set_sort_order(SenseSortOrder::from_position(i));
        }
    }
}
