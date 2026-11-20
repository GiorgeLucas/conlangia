import { Plus, Search, X } from "lucide-react";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import CategoryFormDialog from "./components/dialog/CategoryFormDialog";
import DeleteCategoryDialog from "./components/dialog/DeleteCategoryDialog";
import CategoriesTable from "./components/CategoriesTable";
import CategorySelectionBar from "./components/CategorySelectionBar";
import useCategoriesPage from "./hooks/useCategoriesPage";

export default function CategoriesPage() {
  const {
    categories,
    filteredCategories,
    isLoading,
    loadError,
    search,
    setSearch,
    sort,
    editorOpen,
    editingCategory,
    categoryToDelete,
    setCategoryToDelete,
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
    loadCategories,
    toggleSelected,
    toggleVisibleSelection,
    handleSort,
    openEditor,
    handleSave,
    handleDelete,
    handleEditorOpenChange,
    handleDeleteOpenChange,
    handleBulkDelete,
  } = useCategoriesPage();

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <div className="flex flex-col gap-3.5 border-b border-zinc-200/80 p-5 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Categories
            </h1>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <Button
            onClick={() => openEditor()}
            variant="primary"
            className="!h-9 !px-3.5 !text-xs !gap-1.5 shadow-xs font-medium"
          >
            <Plus size={15} />
            <span>Add category</span>
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
            placeholder="Search categories or descriptions…"
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

      <CategoriesTable
        categories={filteredCategories}
        isLoading={isLoading}
        loadError={loadError}
        search={search}
        sort={sort}
        onSort={handleSort}
        onRetry={() => void loadCategories()}
        onAdd={() => openEditor()}
        selectedIds={selectedIds}
        visibleIds={visibleIds}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleVisible={toggleVisibleSelection}
        onToggleSelected={toggleSelected}
        isDeleting={isBulkDeleting}
        onEdit={openEditor}
        onDelete={setCategoryToDelete}
      />

      <CategoryFormDialog
        open={editorOpen}
        category={editingCategory}
        onOpenChange={handleEditorOpenChange}
        onSave={handleSave}
      />
      <DeleteCategoryDialog
        category={categoryToDelete}
        onOpenChange={handleDeleteOpenChange}
        onDelete={handleDelete}
      />
      <CategorySelectionBar
        selectedCount={selectedIds.size}
        error={bulkError}
        isDeleting={isBulkDeleting}
        deleteDialogOpen={isBulkDeleteOpen}
        onDeleteDialogOpenChange={setIsBulkDeleteOpen}
        onClear={() => {
          clearSelection();
          setBulkError(null);
        }}
        onDelete={() => void handleBulkDelete()}
      />
    </div>
  );
}
