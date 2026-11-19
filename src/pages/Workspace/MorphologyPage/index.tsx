import { useCallback, useEffect, useMemo, useState } from "react";
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
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

      <div className="workspace-table-scrollbar min-h-0 flex-1 overflow-auto pr-3">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
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
                  colSpan={4}
                  className="py-16 text-center text-sm text-zinc-400"
                >
                  Loading morphology types…
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
                <td colSpan={4} className="py-16 text-center">
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
                  className="group hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
                >
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
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
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
    </div>
  );
}
