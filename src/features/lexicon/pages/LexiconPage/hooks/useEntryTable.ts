import { useMemo, useState } from "react";
import {
  EntryDto,
  EntryListRowDto,
} from "@/features/lexicon/api/entries";
import { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import useTableSelection from "@/shared/hooks/useTableSelection";

type SortColumn = "entryForm" | "pronunciation" | "translations" | "type";
type SortDirection = "asc" | "desc";

interface UseEntryTableProps {
  entries: EntryListRowDto[];
  morphTypes: MorphTypeDto[];
  onBulkMorphTypeChange: (
    entryIds: number[],
    morphTypeId: number | null
  ) => Promise<EntryDto[]>;
  onBulkDelete: (entryIds: number[]) => Promise<void>;
}

export default function useEntryTable({
  entries,
  morphTypes,
  onBulkMorphTypeChange,
  onBulkDelete,
}: UseEntryTableProps) {
  const [search, setSearch] = useState("");
  const [bulkMorphTypeId, setBulkMorphTypeId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({ column: "entryForm", direction: "asc" });

  const handleSort = (column: SortColumn) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const morphTypeMap = useMemo(() => {
    const map = new Map<number, MorphTypeDto>();
    for (const morphType of morphTypes) {
      map.set(morphType.id, morphType);
    }
    return map;
  }, [morphTypes]);

  const processedEntries = useMemo(() => {
    let result = entries;

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (entry) =>
          entry.entryForm.toLowerCase().includes(query) ||
          (entry.primaryPronunciation &&
            entry.primaryPronunciation.toLowerCase().includes(query)) ||
          entry.translations.some((translation) =>
            translation.toLowerCase().includes(query)
          )
      );
    }

    return [...result].sort((a, b) => {
      const getValue = (entry: EntryListRowDto): string | null => {
        switch (sort.column) {
          case "entryForm":
            return entry.entryForm;
          case "pronunciation":
            return entry.primaryPronunciation;
          case "translations":
            return entry.translations.join("; ") || null;
          case "type":
            return entry.morphTypeId == null
              ? null
              : morphTypeMap.get(entry.morphTypeId)?.label ?? null;
        }
      };
      const left = getValue(a);
      const right = getValue(b);
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
  }, [entries, morphTypeMap, search, sort]);

  const {
    selectedIds: checkedEntryIds,
    setSelectedIds: setCheckedEntryIds,
    visibleIds: visibleEntryIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelected: toggleEntrySelection,
    toggleVisibleSelection: updateVisibleSelection,
  } = useTableSelection(entries, processedEntries);

  const toggleVisibleSelection = () => {
    updateVisibleSelection();
    setBulkError("");
  };

  const toggleEntrySelectionAndClearError = (entryId: number) => {
    toggleEntrySelection(entryId);
    setBulkError("");
  };

  const applyBulkMorphType = async () => {
    if (
      isBulkUpdating ||
      bulkMorphTypeId === null ||
      checkedEntryIds.size === 0
    ) {
      return;
    }

    setIsBulkUpdating(true);
    setBulkError("");
    try {
      await onBulkMorphTypeChange(
        [...checkedEntryIds],
        bulkMorphTypeId === "__none__" ? null : Number(bulkMorphTypeId)
      );
      setCheckedEntryIds(new Set());
      setBulkMorphTypeId(null);
    } catch (error) {
      setBulkError(String(error));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const applyBulkDelete = async () => {
    if (isBulkDeleting || checkedEntryIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkError("");
    try {
      await onBulkDelete([...checkedEntryIds]);
      setCheckedEntryIds(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setBulkError(String(error));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    search,
    setSearch,
    bulkMorphTypeId,
    setBulkMorphTypeId,
    isBulkUpdating,
    bulkError,
    setBulkError,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isBulkDeleting,
    sort,
    handleSort,
    morphTypeMap,
    processedEntries,
    checkedEntryIds,
    setCheckedEntryIds,
    visibleEntryIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleVisibleSelection,
    toggleEntrySelectionAndClearError,
    applyBulkMorphType,
    applyBulkDelete,
  };
}
