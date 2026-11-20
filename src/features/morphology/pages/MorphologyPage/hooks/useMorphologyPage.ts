import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMorphType,
  deleteMorphType,
  listMorphTypes,
  MorphTypeDto,
  updateMorphTypeBound,
  updateMorphTypeCode,
  updateMorphTypeLabel,
} from "@/features/morphology/api/morphTypes";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import useTableSelection from "@/shared/hooks/useTableSelection";
import type { MorphologySortColumn } from "../components/MorphologyTable";

export default function useMorphologyPage() {
  const [morphTypes, setMorphTypes] = useState<MorphTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    column: MorphologySortColumn;
    direction: "asc" | "desc";
  }>({ column: "code", direction: "asc" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMorphType, setEditingMorphType] =
    useState<MorphTypeDto | null>(null);
  const [morphTypeToDelete, setMorphTypeToDelete] =
    useState<MorphTypeDto | null>(null);
  const [bulkForm, setBulkForm] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const loadMorphTypes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setMorphTypes(await listMorphTypes());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMorphTypes();
  }, [loadMorphTypes]);

  const filteredMorphTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? morphTypes
      : morphTypes.filter(
          (morphType) =>
            morphType.code.toLowerCase().includes(query) ||
            morphType.label.toLowerCase().includes(query)
        );
    return [...filtered].sort((a, b) => {
      const left =
        sort.column === "code"
          ? a.code
          : sort.column === "label"
            ? a.label
            : a.isBound
              ? "Bound"
              : "Free";
      const right =
        sort.column === "code"
          ? b.code
          : sort.column === "label"
            ? b.label
            : b.isBound
              ? "Bound"
              : "Free";
      const comparison = left.localeCompare(right, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [morphTypes, search, sort]);

  const {
    selectedIds,
    setSelectedIds,
    visibleIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelected: updateSelection,
    toggleVisibleSelection: updateVisibleSelection,
    clearSelection,
  } = useTableSelection(morphTypes, filteredMorphTypes);

  const toggleSelected = (id: number) => {
    updateSelection(id);
    setBulkError(null);
  };

  const toggleVisibleSelection = () => {
    updateVisibleSelection();
    setBulkError(null);
  };

  const handleSort = (column: MorphologySortColumn) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const openEditor = (morphType?: MorphTypeDto) => {
    setEditingMorphType(morphType ?? null);
    setEditorOpen(true);
  };

  const handleSave = async (
    code: string,
    label: string,
    isBound: boolean
  ) => {
    if (!editingMorphType) {
      const created = await createMorphType(code, label, isBound);
      setMorphTypes((current) => [...current, created]);
      setLoadError(null);
      return;
    }

    try {
      let updated = editingMorphType;
      if (updated.code !== code) {
        updated = await updateMorphTypeCode(updated.id, code);
      }
      if (updated.label !== label) {
        updated = await updateMorphTypeLabel(updated.id, label);
      }
      if (updated.isBound !== isBound) {
        updated = await updateMorphTypeBound(updated.id, isBound);
      }
      setMorphTypes((current) =>
        current.map((morphType) =>
          morphType.id === updated.id ? updated : morphType
        )
      );
      setLoadError(null);
    } catch (error) {
      try {
        setMorphTypes(await listMorphTypes());
        setLoadError(null);
      } catch (refreshError) {
        setLoadError(
          `Could not refresh morphology types: ${getErrorMessage(refreshError)}`
        );
      }
      throw error;
    }
  };

  const handleDelete = async (morphType: MorphTypeDto) => {
    await deleteMorphType(morphType.id);
    setMorphTypes((current) =>
      current.filter((item) => item.id !== morphType.id)
    );
    setLoadError(null);
  };

  const handleEditorOpenChange = (open: boolean) => {
    setEditorOpen(open);
    if (!open) setEditingMorphType(null);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setMorphTypeToDelete(null);
  };

  const handleBulkFormChange = async () => {
    if (bulkForm === null || selectedIds.size === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    setBulkError(null);
    const updatedIds = new Set<number>();
    const failedIds = new Set<number>();
    let firstError: unknown;

    for (const id of selectedIds) {
      try {
        await updateMorphTypeBound(id, bulkForm === "bound");
        updatedIds.add(id);
      } catch (error) {
        firstError ??= error;
        failedIds.add(id);
      }
    }

    setMorphTypes((current) =>
      current.map((item) =>
        updatedIds.has(item.id)
          ? { ...item, isBound: bulkForm === "bound" }
          : item
      )
    );
    setSelectedIds(failedIds);
    setBulkForm(null);
    if (failedIds.size > 0) {
      setBulkError(
        `${updatedIds.size} updated; ${failedIds.size} failed. ${getErrorMessage(firstError)}`
      );
    }
    setIsBulkUpdating(false);
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
        await deleteMorphType(id);
        deletedIds.add(id);
      } catch (error) {
        firstError ??= error;
        failedIds.add(id);
      }
    }

    setMorphTypes((current) =>
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
  };
}
