import { invoke } from "@tauri-apps/api/core";

export interface SenseDto {
  id: number;
  translation: string;
  definition: string | null;
  sortOrder: number;
  categoryId: number | null;
}

export interface PronunciationDto {
  id: number;
  value: string;
  description: string | null;
  sortOrder: number;
}

export interface EntryDto {
  id: number;
  entryForm: string;
  morphTypeId: number | null;
  pronunciations: PronunciationDto[];
  senses: SenseDto[];
}

export interface EntryListRowDto {
  id: number;
  entryForm: string;
  primaryPronunciation: string | null;
  translations: string[];
  morphTypeId?: number | null;
}

export interface EntryListDto {
  rows: EntryListRowDto[];
}

export interface BulkCreateEntriesResult {
  createdEntries: EntryDto[];
  skippedCount: number;
}

export function createEntry(
  entryForm: string,
  morphTypeId?: number | null
): Promise<EntryDto> {
  return invoke<EntryDto>("create_entry", {
    entryForm,
    morphTypeId: morphTypeId ?? null,
  });
}

export function createEntries(entryForms: string[]): Promise<BulkCreateEntriesResult> {
  return invoke<BulkCreateEntriesResult>("create_entries", { entryForms });
}

export function listEntries(): Promise<EntryListDto> {
  return invoke<EntryListDto>("list_entries");
}

export function getEntry(entryId: number): Promise<EntryDto | null> {
  return invoke<EntryDto | null>("get_entry", { entryId });
}

export function deleteEntry(entryId: number): Promise<void> {
  return invoke<void>("delete_entry", { entryId });
}

export function deleteEntries(entryIds: number[]): Promise<number[]> {
  return invoke<number[]>("delete_entries", { entryIds });
}

export function updateEntryForm(
  entryId: number,
  entryForm: string
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_form", {
    entryId,
    entryForm,
  });
}

export function updateEntryMorphType(
  entryId: number,
  morphTypeId: number | null
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_morph_type", {
    entryId,
    morphTypeId,
  });
}

export function updateEntriesMorphType(
  entryIds: number[],
  morphTypeId: number | null
): Promise<EntryDto[]> {
  return invoke<EntryDto[]>("update_entries_morph_type", {
    entryIds,
    morphTypeId,
  });
}

export function addEntryPronunciation(
  entryId: number,
  value: string,
  description?: string | null
): Promise<EntryDto> {
  return invoke<EntryDto>("add_entry_pronunciation", {
    entryId,
    value,
    description: description ?? null,
  });
}

export function updateEntryPronunciationValue(
  entryId: number,
  id: number,
  value: string
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_pronunciation_value", {
    entryId,
    id,
    value,
  });
}

export function updateEntryPronunciationDescription(
  entryId: number,
  id: number,
  description?: string | null
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_pronunciation_description", {
    entryId,
    id,
    description: description ?? null,
  });
}

export function moveEntryPronunciation(
  entryId: number,
  id: number,
  newPosition: number
): Promise<EntryDto> {
  return invoke<EntryDto>("move_entry_pronunciation", {
    entryId,
    id,
    newPosition,
  });
}

export function removeEntryPronunciation(
  entryId: number,
  id: number
): Promise<EntryDto> {
  return invoke<EntryDto>("remove_entry_pronunciation", {
    entryId,
    id,
  });
}

export function addEntrySense(
  entryId: number,
  translation: string,
  definition?: string | null,
  categoryId?: number | null
): Promise<EntryDto> {
  return invoke<EntryDto>("add_entry_sense", {
    entryId,
    translation,
    definition: definition ?? null,
    categoryId: categoryId ?? null,
  });
}

export function updateEntrySenseTranslation(
  entryId: number,
  id: number,
  translation: string
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_sense_translation", {
    entryId,
    id,
    translation,
  });
}

export function updateEntrySenseDefinition(
  entryId: number,
  id: number,
  definition?: string | null
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_sense_definition", {
    entryId,
    id,
    definition: definition ?? null,
  });
}

export function updateEntrySenseCategory(
  entryId: number,
  id: number,
  categoryId: number | null
): Promise<EntryDto> {
  return invoke<EntryDto>("update_entry_sense_category", {
    entryId,
    id,
    categoryId,
  });
}

export function moveEntrySense(
  entryId: number,
  id: number,
  newPosition: number
): Promise<EntryDto> {
  return invoke<EntryDto>("move_entry_sense", {
    entryId,
    id,
    newPosition,
  });
}

export function removeEntrySense(
  entryId: number,
  id: number
): Promise<EntryDto> {
  return invoke<EntryDto>("remove_entry_sense", {
    entryId,
    id,
  });
}
