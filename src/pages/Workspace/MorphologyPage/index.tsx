import { useCallback, useEffect, useMemo, useState } from "react";
import { Select } from "@base-ui/react/select";
import {
  createMorphType,
  deleteMorphType,
  listMorphTypes,
  MorphTypeDto,
  updateMorphTypeBound,
  updateMorphTypeCode,
  updateMorphTypeLabel,
} from "@/api/morphTypes";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import Badge from "@/ui/Badge";
import {
  AlertCircle,
  Boxes,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DeleteMorphTypeDialog from "./components/dialog/DeleteMorphTypeDialog";
import MorphTypeFormDialog from "./components/dialog/MorphTypeFormDialog";
import getErrorMessage from "../utils/getErrorMessage";
import SortableTableHeader from "@/ui/SortableTableHeader";
import TableSelectionCheckbox from "@/ui/TableSelectionCheckbox";
import { Modal } from "@/ui/Modal";

type SortColumn = "code" | "label" | "form";
type SortDirection = "asc" | "desc";

export default function MorphologyPage() {
  const [morphTypes, setMorphTypes] = useState<MorphTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({ column: "code", direction: "asc" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMorphType, setEditingMorphType] =
    useState<MorphTypeDto | null>(null);

  const [morphTypeToDelete, setMorphTypeToDelete] =
    useState<MorphTypeDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
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

  useEffect(() => {
    const availableIds = new Set(morphTypes.map(({ id }) => id));
    setSelectedIds((current) => {
      const retained = new Set(
        [...current].filter((id) => availableIds.has(id))
      );
      return retained.size === current.size ? current : retained;
    });
  }, [morphTypes]);

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

  const handleSort = (column: SortColumn) => {
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

  const handleSave = async (code: string, label: string, isBound: boolean) => {
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

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setBulkError(null);
  };

  const visibleIds = filteredMorphTypes.map(({ id }) => id);
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

      <div
        className={`workspace-table-scrollbar min-h-0 flex-1 overflow-auto pr-3 ${
          selectedIds.size > 0 ? "pb-24" : ""
        }`}
      >
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-10" />
            <col className="w-32" />
            <col />
            <col className="w-24" />
            <col className="w-24" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            <tr className="group">
              <th className="px-3 py-3">
                <TableSelectionCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onChange={toggleVisibleSelection}
                  label="Select all visible morphology types"
                  disabled={
                    visibleIds.length === 0 || isBulkUpdating || isBulkDeleting
                  }
                  visible={selectedIds.size > 0}
                />
              </th>
              <SortableTableHeader
                label="Code"
                active={sort.column === "code"}
                direction={sort.direction}
                onClick={() => handleSort("code")}
                className="px-5 py-3"
              />
              <SortableTableHeader
                label="Label"
                active={sort.column === "label"}
                direction={sort.direction}
                onClick={() => handleSort("label")}
                className="px-4 py-3"
              />
              <SortableTableHeader
                label="Form"
                active={sort.column === "form"}
                direction={sort.direction}
                onClick={() => handleSort("form")}
                className="px-4 py-3"
              />
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-16 text-center text-sm text-zinc-400"
                >
                  Loading morphology types…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <AlertCircle size={26} className="text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {loadError}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => void loadMorphTypes()}
                      className="!h-8 !px-3 !text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Try again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : filteredMorphTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <Boxes size={30} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {search
                        ? `No morphology types found matching "${search}"`
                        : "No morphology types recorded yet."}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => openEditor()}
                        variant="secondary"
                        className="!h-8 !px-3 !text-xs !gap-1"
                      >
                        <Plus size={13} />
                        Add first type
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMorphTypes.map((morphType) => (
                <tr
                  key={morphType.id}
                  onClick={() => toggleSelected(morphType.id)}
                  className={`group ${
                    selectedIds.has(morphType.id)
                      ? "bg-violet-50/50 dark:bg-violet-950/15"
                      : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
                  } ${selectedIds.size > 0 ? "cursor-pointer" : ""}`}
                >
                  <td
                    className="px-3 py-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (event.target === event.currentTarget) {
                        toggleSelected(morphType.id);
                      }
                    }}
                  >
                    <TableSelectionCheckbox
                      checked={selectedIds.has(morphType.id)}
                      onChange={() => toggleSelected(morphType.id)}
                      label={`Select ${morphType.label}`}
                      disabled={isBulkUpdating || isBulkDeleting}
                      visible={selectedIds.has(morphType.id)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="neutral" size="xs">
                      {morphType.code}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {morphType.label}
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={morphType.isBound ? "accent" : "neutral"}
                      size="xs"
                      dot
                    >
                      {morphType.isBound ? "Bound" : "Free"}
                    </Badge>
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isBulkUpdating || isBulkDeleting}
                        onClick={() => openEditor(morphType)}
                        title="Edit morphology type"
                        aria-label={`Edit ${morphType.label}`}
                        className="!h-auto !rounded-md !p-2 !text-zinc-400 hover:!bg-violet-50 hover:!text-violet-700 dark:hover:!bg-violet-950/40 dark:hover:!text-violet-300"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isBulkUpdating || isBulkDeleting}
                        onClick={() => {
                          setMorphTypeToDelete(morphType);
                        }}
                        title="Delete morphology type"
                        aria-label={`Delete ${morphType.label}`}
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
            <Select.Root
              value={bulkForm}
              onValueChange={setBulkForm}
              items={[
                { value: "free", label: "Free" },
                { value: "bound", label: "Bound" },
              ]}
              disabled={isBulkUpdating || isBulkDeleting}
            >
              <Select.Trigger
                aria-label="Set form for selected morphology types"
                className="flex h-9 w-36 items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-xs outline-none transition-colors hover:border-zinc-300 focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600"
              >
                <Select.Value placeholder="Form…" />
                <Select.Icon className="shrink-0 text-zinc-400">
                  <ChevronDown size={14} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  sideOffset={6}
                  className="z-50 min-w-(--anchor-width)"
                >
                  <Select.Popup className="rounded-xl border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-2xl">
                    {[
                      { value: "free", label: "Free" },
                      { value: "bound", label: "Bound" },
                    ].map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-xs text-zinc-800 outline-none transition-colors data-highlighted:bg-violet-50 data-highlighted:text-violet-900 dark:text-zinc-200 dark:data-highlighted:bg-violet-950/40 dark:data-highlighted:text-violet-200"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                        <Select.ItemIndicator className="ml-2 text-violet-600 dark:text-violet-400">
                          <Check size={13} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleBulkFormChange()}
              disabled={bulkForm === null || isBulkUpdating || isBulkDeleting}
              className="!h-9 !px-3 !text-xs !gap-1.5"
            >
              <Check size={14} />
              {isBulkUpdating ? "Applying…" : "Apply"}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={isBulkUpdating || isBulkDeleting}
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
              disabled={isBulkUpdating || isBulkDeleting}
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
          selectedIds.size === 1 ? "morphology type" : "morphology types"
        }?`}
        description="Entries using these types will no longer have a morphology type assigned."
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
            {isBulkDeleting ? "Deleting…" : "Delete types"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
