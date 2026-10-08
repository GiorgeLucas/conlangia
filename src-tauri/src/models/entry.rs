use thiserror::Error;

#[derive(Debug, Error)]
pub enum EntryError {
    #[error("pronunciation with id {0} was not found in the entry")]
    PronunciationNotFound(i32),
    #[error("sense with id {0} was not found in the entry")]
    SenseNotFound(i32),
}

pub struct Entry {
    id: Option<i32>,
    entry_form: String,
    pronunciations: Vec<Pronunciation>,
    senses: Vec<Sense>,
    morph_type_id: Option<i32>,
}
impl Entry {
    pub fn new(entry_form: String) -> Self {
        Self {
            id: None,
            entry_form,
            pronunciations: Vec::new(),
            senses: Vec::new(),
            morph_type_id: None,
        }
    }
    pub fn id(&self) -> &Option<i32> {
        &self.id
    }
    pub fn entry_form(&self) -> &String {
        &self.entry_form
    }
    pub fn pronunciations(&self) -> &Vec<Pronunciation> {
        &self.pronunciations
    }
    pub fn senses(&self) -> &Vec<Sense> {
        &self.senses
    }
    pub fn morph_type_id(&self) -> &Option<i32> {
        &self.morph_type_id
    }
    
    pub fn add_pronunciation(&mut self, pronunciation: Pronunciation) {
        &self.pronunciations.push(pronunciation);
    }
    pub fn remove_pronunciation(&mut self, pronunciation_id: i32) -> Result<(), EntryError> {
        let index = self
            .pronunciations
            .iter()
            .position(|pronunciation| pronunciation.id() == &Some(pronunciation_id))
            .ok_or(EntryError::PronunciationNotFound(pronunciation_id))?;

        self.pronunciations.remove(index);

        Ok(())
    }

    pub fn add_sense(&mut self, sense: Sense) {
        &self.senses.push(sense);
    }
    pub fn remove_sense(&mut self, sense_id: i32) -> Result<(), EntryError> {
        let index = self
            .senses
            .iter()
            .position(|sense| sense.id() == &Some(sense_id))
            .ok_or(EntryError::SenseNotFound(sense_id))?;

        self.senses.remove(index);

        Ok(())
    }
}

pub struct Sense {
    pub id: Option<i32>,
    pub translation: String,
    pub definition: Option<String>,
    pub sort_order: Option<i32>,
    pub category_id: Option<i32>,
}
impl Sense {
    pub fn new(
        translation: String,
        definition: Option<String>,
        sort_order: Option<i32>,
        category_id: Option<i32>,
    ) -> Self {
        Self {
            id: None,
            translation,
            definition,
            sort_order,
            category_id,
        }
    }
    pub fn id(&self) -> &Option<i32> {
        &self.id
    }
    pub fn translation(&self) -> &String {
        &self.translation
    }
    pub fn definition(&self) -> &Option<String> {
        &self.definition
    }
    pub fn sort_order(&self) -> &Option<i32> {
        &self.sort_order
    }
    pub fn category_id(&self) -> &Option<i32> {
        &self.category_id
    }
}

pub struct Pronunciation {
    id: Option<i32>,
    value: String,
    description: Option<String>,
    sort_order: Option<i32>,
}
impl Pronunciation {
    pub fn new(value: String, description: Option<String>, sort_order: Option<i32>) -> Self {
        Self {
            id: None,
            value,
            description,
            sort_order,
        }
    }
    pub fn id(&self) -> &Option<i32> {
        &self.id
    }
    pub fn value(&self) -> &String {
        &self.value
    }
    pub fn description(&self) -> &Option<String> {
        &self.description
    }
    pub fn sort_order(&self) -> &Option<i32> {
        &self.sort_order
    }
}

pub struct MorphType {
    pub id: Option<i32>,
    pub code: String,
    pub label: String,
    pub is_bound: bool,
}
