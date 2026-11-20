import { useCallback, useEffect, useState } from "react";
import {
  BulkCreateEntriesResult,
  EntryDto,
  EntryListRowDto,
  createEntries,
  createEntry,
  deleteEntries,
  getEntry,
  listEntries,
  updateEntriesMorphType,
} from "@/features/lexicon/api/entries";
import { CategoryDto, listCategories } from "@/features/categories/api/categories";
import {
  MorphTypeDto,
  listMorphTypes,
} from "@/features/morphology/api/morphTypes";

export default function useLexiconPage() {
  const [entries, setEntries] = useState<EntryListRowDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [morphTypes, setMorphTypes] = useState<MorphTypeDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<EntryDto | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSelectEntry = useCallback(async (id: number) => {
    setSelectedId(id);
    setIsLoadingDetail(true);
    try {
      const entry = await getEntry(id);
      setSelectedEntry(entry);
    } catch (err) {
      console.error("Failed to get entry details:", err);
      setSelectedEntry(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const loadLexiconData = useCallback(async () => {
    setIsLoadingEntries(true);
    try {
      const [entriesRes, catsRes, morphsRes] = await Promise.all([
        listEntries(),
        listCategories(),
        listMorphTypes(),
      ]);
      setEntries(entriesRes.rows);
      setCategories(catsRes);
      setMorphTypes(morphsRes);
      const firstEntry = [...entriesRes.rows].sort((a, b) =>
        a.entryForm.localeCompare(b.entryForm, undefined, {
          sensitivity: "base",
          numeric: true,
        })
      )[0];
      if (firstEntry) await handleSelectEntry(firstEntry.id);
    } catch (err) {
      console.error("Failed to load lexicon data:", err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [handleSelectEntry]);

  useEffect(() => {
    loadLexiconData();
  }, [loadLexiconData]);

  const handleEntryUpdated = (updated: EntryDto) => {
    setSelectedEntry(updated);
    setEntries((previous) =>
      previous.map((row) =>
        row.id === updated.id ? entryToListRow(updated) : row
      )
    );
  };

  const handleEntryCreated = (newEntry: EntryDto) => {
    const newRow = entryToListRow(newEntry);
    setEntries((previous) => [newRow, ...previous]);
    setSelectedId(newEntry.id);
    setSelectedEntry(newEntry);
  };

  const handleQuickAdd = async (entryForm: string) => {
    const entry = await createEntry(entryForm, null);
    handleEntryCreated(entry);
  };

  const handleBulkAdd = async (
    entryForms: string[]
  ): Promise<BulkCreateEntriesResult> => {
    const result = await createEntries(entryForms);
    const newRows = result.createdEntries.map(entryToListRow);
    setEntries((previous) => [...newRows, ...previous]);
    return result;
  };

  const handleBulkMorphTypeChange = async (
    entryIds: number[],
    morphTypeId: number | null
  ): Promise<EntryDto[]> => {
    const updatedEntries = await updateEntriesMorphType(entryIds, morphTypeId);
    const updatedById = new Map(
      updatedEntries.map((entry) => [entry.id, entry])
    );
    setEntries((previous) =>
      previous.map((row) => {
        const updated = updatedById.get(row.id);
        return updated ? entryToListRow(updated) : row;
      })
    );
    setSelectedEntry((current) =>
      current ? updatedById.get(current.id) ?? current : current
    );
    return updatedEntries;
  };

  const handleBulkDelete = async (entryIds: number[]) => {
    const deletedIds = await deleteEntries(entryIds);
    const deletedIdSet = new Set(deletedIds);
    setEntries((previous) =>
      previous.filter((entry) => !deletedIdSet.has(entry.id))
    );
    if (selectedId !== null && deletedIdSet.has(selectedId)) {
      setSelectedId(null);
      setSelectedEntry(null);
    }
  };

  const handleEntryDeleted = (id: number) => {
    setEntries((previous) => previous.filter((row) => row.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedEntry(null);
    }
  };

  return {
    entries,
    categories,
    morphTypes,
    selectedId,
    selectedEntry,
    isLoadingEntries,
    isLoadingDetail,
    isCreateOpen,
    setIsCreateOpen,
    handleSelectEntry,
    handleEntryUpdated,
    handleEntryCreated,
    handleEntryDeleted,
    handleQuickAdd,
    handleBulkAdd,
    handleBulkMorphTypeChange,
    handleBulkDelete,
  };
}

function entryToListRow(entry: EntryDto): EntryListRowDto {
  return {
    id: entry.id,
    entryForm: entry.entryForm,
    primaryPronunciation:
      entry.pronunciations.length > 0
        ? entry.pronunciations[0].value
        : null,
    translations: entry.senses.map((sense) => sense.translation),
    morphTypeId: entry.morphTypeId,
  };
}
