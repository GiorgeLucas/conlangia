import { useState, useEffect, useCallback } from "react";
import {
  EntryDto,
  EntryListRowDto,
  listEntries,
  getEntry,
} from "@/api/entries";
import { CategoryDto, listCategories } from "@/api/categories";
import { MorphTypeDto, listMorphTypes } from "@/api/morphTypes";
import EntryTable from "./components/EntryTable";
import EntryDetail from "./components/EntryDetail";
import CreateEntryDialog from "./components/CreateEntryDialog";
import { BookOpen, Plus } from "lucide-react";
import Button from "@/ui/Button";

export default function LexiconPage() {
  const [entries, setEntries] = useState<EntryListRowDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [morphTypes, setMorphTypes] = useState<MorphTypeDto[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<EntryDto | null>(null);

  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Load all initial data for the lexicon
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
    } catch (err) {
      console.error("Failed to load lexicon data:", err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadLexiconData();
  }, [loadLexiconData]);

  // Load selected entry details
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

  // Sync entry changes back into the row list
  const handleEntryUpdated = (updated: EntryDto) => {
    setSelectedEntry(updated);
    setEntries((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              entryForm: updated.entryForm,
              primaryPronunciation:
                updated.pronunciations.length > 0
                  ? updated.pronunciations[0].value
                  : null,
              translations: updated.senses.map((s) => s.translation),
              morphTypeId: updated.morphTypeId,
            }
          : row
      )
    );
  };

  const handleEntryCreated = (newEntry: EntryDto) => {
    const newRow: EntryListRowDto = {
      id: newEntry.id,
      entryForm: newEntry.entryForm,
      primaryPronunciation:
        newEntry.pronunciations.length > 0
          ? newEntry.pronunciations[0].value
          : null,
      translations: newEntry.senses.map((s) => s.translation),
      morphTypeId: newEntry.morphTypeId,
    };
    setEntries((prev) => [newRow, ...prev]);
    setSelectedId(newEntry.id);
    setSelectedEntry(newEntry);
  };

  const handleEntryDeleted = (id: number) => {
    setEntries((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedEntry(null);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Table with all lexicon entries */}
      <EntryTable
        entries={entries}
        morphTypes={morphTypes}
        selectedId={selectedId}
        onSelect={handleSelectEntry}
        onOpenCreate={() => setIsCreateOpen(true)}
        isLoading={isLoadingEntries}
      />

      {/* Detail editor pane (kept strictly at ~460px-480px, in the 450px-500px range) */}
      <div className="flex w-[460px] xl:w-[480px] shrink-0 flex-col overflow-y-auto bg-white dark:bg-zinc-950">
        {isLoadingDetail ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
            Loading entry…
          </div>
        ) : selectedEntry ? (
          <EntryDetail
            entry={selectedEntry}
            morphTypes={morphTypes}
            categories={categories}
            onEntryUpdated={handleEntryUpdated}
            onEntryDeleted={handleEntryDeleted}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-xs border border-zinc-200/80 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-600 mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              No word selected
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Select an entry from the table on the left to inspect its pronunciations,
              meanings, and morphology, or create a new entry.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              variant="secondary"
              className="mt-4 !h-8 !px-3 !text-xs !gap-1.5 shadow-2xs"
            >
              <Plus size={14} />
              <span>Add word</span>
            </Button>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <CreateEntryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        morphTypes={morphTypes}
        onCreated={handleEntryCreated}
      />
    </div>
  );
}
