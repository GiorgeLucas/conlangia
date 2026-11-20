import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CategoryDto,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategoryDescription,
  updateCategoryName,
} from "@/api/categories";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import { AlertCircle, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import CategoryFormDialog from "./components/dialog/CategoryFormDialog";
import DeleteCategoryDialog from "./components/dialog/DeleteCategoryDialog";
import getErrorMessage from "../utils/getErrorMessage";
import SortableTableHeader from "@/ui/SortableTableHeader";
import TableSelectionCheckbox from "@/ui/TableSelectionCheckbox";
import { Modal } from "@/ui/Modal";

type SortColumn = "name" | "description";
type SortDirection = "asc" | "desc";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({ column: "name", direction: "asc" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null
  );

  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setCategories(await listCategories());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const availableIds = new Set(categories.map(({ id }) => id));
    setSelectedIds((current) => {
      const retained = new Set(
        [...current].filter((id) => availableIds.has(id))
      );
      return retained.size === current.size ? current : retained;
    });
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? categories
      : categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.description?.toLowerCase().includes(query) ?? false)
    );
    return [...filtered].sort((a, b) => {
      const left = sort.column === "name" ? a.name : a.description;
      const right = sort.column === "name" ? b.name : b.description;
      if (left == null || right == null) {
        if (left == null && right == null) return 0;
        return left == null ? 1 : -1;
      }
      const comparison = left.localeCompare(right, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [categories, search, sort]);

  const handleSort = (column: SortColumn) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const openEditor = (category?: CategoryDto) => {
    setEditingCategory(category ?? null);
    setEditorOpen(true);
  };

  const handleSave = async (name: string, description: string) => {
    if (!editingCategory) {
      const created = await createCategory(name, description || null);
      setCategories((current) => [...current, created]);
      setLoadError(null);
      return;
    }

    try {
      let updated = editingCategory;
      if (updated.name !== name) {
        updated = await updateCategoryName(updated.id, name);
      }
      if (updated.description !== (description || null)) {
        updated = await updateCategoryDescription(
          updated.id,
          description || null
        );
      }
      setCategories((current) =>
        current.map((category) =>
          category.id === updated.id ? updated : category
        )
      );
      setLoadError(null);
    } catch (error) {
      try {
        setCategories(await listCategories());
        setLoadError(null);
      } catch (refreshError) {
        setLoadError(
          `Could not refresh categories: ${getErrorMessage(refreshError)}`
        );
      }
      throw error;
    }
  };

  const handleDelete = async (category: CategoryDto) => {
    await deleteCategory(category.id);
    setCategories((current) =>
      current.filter((item) => item.id !== category.id)
    );
    setLoadError(null);
  };

  const handleEditorOpenChange = (open: boolean) => {
    setEditorOpen(open);
    if (!open) setEditingCategory(null);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setCategoryToDelete(null);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setBulkError(null);
  };

  const visibleIds = filteredCategories.map(({ id }) => id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
    setBulkError(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    setIsBulkDeleting(true);
    setBulkError(null);
    const deletedIds = new Set<number>();
    const failedIds = new Set<number>();
    let firstError: unknown;

    for (const id of selectedIds) {
      try {
        await deleteCategory(id);
        deletedIds.add(id);
      } catch (error) {
        firstError ??= error;
        failedIds.add(id);
      }
    }

    setCategories((current) =>
      current.filter((item) => !deletedIds.has(item.id))
    );
    setSelectedIds(failedIds);
    setIsBulkDeleteOpen(false);
    if (failedIds.size > 0) {
      setBulkError(
        `${deletedIds.size} deleted; ${failedIds.size} failed. ${getErrorMessage(firstError)}`
      );
    }
    setIsBulkDeleting(false);
  };

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

      <div
        className={`workspace-table-scrollbar min-h-0 flex-1 overflow-auto pr-3 ${
          selectedIds.size > 0 ? "pb-24" : ""
        }`}
      >
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-10" />
            <col className="w-[30%]" />
            <col />
            <col className="w-24" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            <tr className="group">
              <th className="px-3 py-3">
                <TableSelectionCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onChange={toggleVisibleSelection}
                  label="Select all visible categories"
                  disabled={visibleIds.length === 0 || isBulkDeleting}
                  visible={selectedIds.size > 0}
                />
              </th>
              <SortableTableHeader
                label="Category"
                active={sort.column === "name"}
                direction={sort.direction}
                onClick={() => handleSort("name")}
                className="px-5 py-3"
              />
              <SortableTableHeader
                label="Description"
                active={sort.column === "description"}
                direction={sort.direction}
                onClick={() => handleSort("description")}
                className="px-4 py-3"
              />
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-16 text-center text-sm text-zinc-400"
                >
                  Loading categories…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <AlertCircle size={26} className="text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {loadError}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => void loadCategories()}
                      className="!h-8 !px-3 !text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Try again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <Tags size={30} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {search
                        ? `No categories found matching "${search}"`
                        : "No categories recorded yet."}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => openEditor()}
                        variant="secondary"
                        className="!h-8 !px-3 !text-xs !gap-1"
                      >
                        <Plus size={13} />
                        Add first category
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  onClick={() => {
                    if (selectedIds.size > 0) toggleSelected(category.id);
                  }}
                  className={`group ${
                    selectedIds.has(category.id)
                      ? "bg-violet-50/50 dark:bg-violet-950/15"
                      : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
                  } ${selectedIds.size > 0 ? "cursor-pointer" : ""}`}
                >
                  <td
                    className="px-3 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TableSelectionCheckbox
                      checked={selectedIds.has(category.id)}
                      onChange={() => toggleSelected(category.id)}
                      label={`Select ${category.name}`}
                      disabled={isBulkDeleting}
                      visible={selectedIds.has(category.id)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {category.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {category.description ? (
                      <span className="block truncate" title={category.description}>
                        {category.description}
                      </span>
                    ) : (
                      <span className="italic text-zinc-400 dark:text-zinc-600">
                        No description
                      </span>
                    )}
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isBulkDeleting}
                        onClick={() => openEditor(category)}
                        title="Edit category"
                        aria-label={`Edit ${category.name}`}
                        className="!h-auto !rounded-md !p-2 !text-zinc-400 hover:!bg-violet-50 hover:!text-violet-700 dark:hover:!bg-violet-950/40 dark:hover:!text-violet-300"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isBulkDeleting}
                        onClick={() => {
                          setCategoryToDelete(category);
                        }}
                        title="Delete category"
                        aria-label={`Delete ${category.name}`}
                        className="!h-auto !rounded-md !p-2 !text-zinc-400 hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-400"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
      {selectedIds.size > 0 && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
          {bulkError && (
            <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">
              {bulkError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto pl-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {selectedIds.size} selected
            </span>
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={isBulkDeleting}
              className="!h-9 !px-3 !text-xs !gap-1.5"
            >
              <Trash2 size={14} />
              Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedIds(new Set());
                setBulkError(null);
              }}
              disabled={isBulkDeleting}
              className="!h-9 !px-2.5 !text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
      <Modal
        open={isBulkDeleteOpen}
        onOpenChange={(open) => {
          if (!isBulkDeleting) setIsBulkDeleteOpen(open);
        }}
        title={`Delete ${selectedIds.size} ${
          selectedIds.size === 1 ? "category" : "categories"
        }?`}
        description="Senses using these categories will become uncategorized."
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isBulkDeleting}
            onClick={() => setIsBulkDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isBulkDeleting || selectedIds.size === 0}
            onClick={() => void handleBulkDelete()}
          >
            {isBulkDeleting ? "Deleting…" : "Delete categories"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
