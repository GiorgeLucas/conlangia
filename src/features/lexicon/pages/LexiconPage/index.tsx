import { BookOpen, Plus } from "lucide-react";
import Button from "@/shared/components/Button";
import CreateEntryDialog from "./components/CreateEntryDialog";
import EntryDetail from "./components/EntryDetail";
import EntryTable from "./components/EntryTable";
import useLexiconPage from "./hooks/useLexiconPage";

export default function LexiconPage() {
  const {
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
  } = useLexiconPage();

  return (
    <div className="flex h-full w-full overflow-hidden">
      <EntryTable
        entries={entries}
        morphTypes={morphTypes}
        selectedId={selectedId}
        onSelect={handleSelectEntry}
        onOpenCreate={() => setIsCreateOpen(true)}
        onQuickAdd={handleQuickAdd}
        onBulkAdd={handleBulkAdd}
        onBulkMorphTypeChange={handleBulkMorphTypeChange}
        onBulkDelete={handleBulkDelete}
        isLoading={isLoadingEntries}
      />

      <div className="workspace-table-scrollbar flex w-[460px] xl:w-[480px] shrink-0 flex-col overflow-y-auto bg-white pr-3 dark:bg-zinc-950">
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

      <CreateEntryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        morphTypes={morphTypes}
        onCreated={handleEntryCreated}
      />
    </div>
  );
}
