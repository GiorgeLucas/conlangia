import { Plus, Search, X } from "lucide-react";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import DeleteMorphTypeDialog from "./components/dialog/DeleteMorphTypeDialog";
import MorphTypeFormDialog from "./components/dialog/MorphTypeFormDialog";
import MorphologyTable from "./components/MorphologyTable";
import MorphologySelectionBar from "./components/MorphologySelectionBar";
import useMorphologyPage from "./hooks/useMorphologyPage";

export default function MorphologyPage() {
  const {
    morphTypes,
    filteredMorphTypes,
    isLoading,
    loadError,
    search,
    setSearch,
    sort,
    editorOpen,
    editingMorphType,
    morphTypeToDelete,
    setMorphTypeToDelete,
    bulkForm,
    setBulkForm,
    isBulkUpdating,
    isBulkDeleting,
    isBulkDeleteOpen,
    setIsBulkDeleteOpen,
    bulkError,
    setBulkError,
    selectedIds,
    visibleIds,
    allVisibleSelected,
    someVisibleSelected,
    clearSelection,
    loadMorphTypes,
    toggleSelected,
    toggleVisibleSelection,
    handleSort,
    openEditor,
    handleSave,
    handleDelete,
    handleEditorOpenChange,
    handleDeleteOpenChange,
    handleBulkFormChange,
    handleBulkDelete,
  } = useMorphologyPage();

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <div className="flex flex-col gap-3.5 border-b border-zinc-200/80 p-5 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Morphology
            </h1>
            <Badge variant="accent" size="xs" className="font-semibold">
              {morphTypes.length}{" "}
              {morphTypes.length === 1 ? "type" : "types"}
            </Badge>
          </div>
          <Button
            onClick={() => openEditor()}
            variant="primary"
            className="!h-9 !px-3.5 !text-xs !gap-1.5 shadow-xs font-medium"
          >
            <Plus size={15} />
            <span>Add type</span>
          </Button>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search morphology codes or labels…"
            className="!h-10 w-full !rounded-xl !border-zinc-200/80 !bg-zinc-50/70 !pl-10 !pr-9 !text-sm !text-zinc-800 !font-normal !tracking-normal !outline-none !transition-all placeholder:!text-zinc-400 focus:!border-violet-500 focus:!bg-white focus:!ring-2 focus:!ring-violet-500/20 dark:!border-zinc-800 dark:!bg-zinc-900/60 dark:!text-zinc-200 dark:focus:!border-violet-500 dark:focus:!bg-zinc-900/60"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="!absolute !right-3 !top-1/2 !h-auto !-translate-y-1/2 !rounded-md !p-1 !text-zinc-400 hover:!bg-zinc-200/60 hover:!text-zinc-700 dark:hover:!bg-zinc-800 dark:hover:!text-zinc-200"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      <MorphologyTable
        morphTypes={filteredMorphTypes}
        isLoading={isLoading}
        loadError={loadError}
        search={search}
        sort={sort}
        onSort={handleSort}
        onRetry={() => void loadMorphTypes()}
        onAdd={() => openEditor()}
        selectedIds={selectedIds}
        visibleIds={visibleIds}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleVisible={toggleVisibleSelection}
        onToggleSelected={toggleSelected}
        isBusy={isBulkUpdating || isBulkDeleting}
        onEdit={openEditor}
        onDelete={setMorphTypeToDelete}
      />

      <MorphTypeFormDialog
        open={editorOpen}
        morphType={editingMorphType}
        onOpenChange={handleEditorOpenChange}
        onSave={handleSave}
      />
      <DeleteMorphTypeDialog
        morphType={morphTypeToDelete}
        onOpenChange={handleDeleteOpenChange}
        onDelete={handleDelete}
      />
      <MorphologySelectionBar
        selectedCount={selectedIds.size}
        error={bulkError}
        form={bulkForm}
        onFormChange={setBulkForm}
        isUpdating={isBulkUpdating}
        isDeleting={isBulkDeleting}
        onApply={() => void handleBulkFormChange()}
        onClear={() => {
          clearSelection();
          setBulkError(null);
        }}
        deleteDialogOpen={isBulkDeleteOpen}
        onDeleteDialogOpenChange={setIsBulkDeleteOpen}
        onDelete={() => void handleBulkDelete()}
      />
    </div>
  );
}
