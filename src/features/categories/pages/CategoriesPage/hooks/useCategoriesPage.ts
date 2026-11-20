import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CategoryDto,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategoryDescription,
  updateCategoryName,
} from "@/features/categories/api/categories";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import useTableSelection from "@/shared/hooks/useTableSelection";
import type { CategorySortColumn } from "../components/CategoriesTable";

export default function useCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    column: CategorySortColumn;
    direction: "asc" | "desc";
  }>({ column: "name", direction: "asc" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null
  );
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryDto | null>(null);
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

  const {
    selectedIds,
    setSelectedIds,
    visibleIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelected: updateSelection,
    toggleVisibleSelection: updateVisibleSelection,
    clearSelection,
  } = useTableSelection(categories, filteredCategories);

  const toggleSelected = (id: number) => {
    updateSelection(id);
    setBulkError(null);
  };

  const toggleVisibleSelection = () => {
    updateVisibleSelection();
    setBulkError(null);
  };

  const handleSort = (column: CategorySortColumn) => {
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

  return {
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
  };
}
