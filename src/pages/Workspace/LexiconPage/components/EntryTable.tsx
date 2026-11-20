import { useEffect, useMemo, useState } from "react";
import {
  BulkCreateEntriesResult,
  EntryDto,
  EntryListRowDto,
} from "@/api/entries";
import { MorphTypeDto } from "@/api/morphTypes";
import { Checkbox } from "@base-ui/react/checkbox";
import { Select } from "@base-ui/react/select";
import {
  BookOpen,
  Check,
  ChevronDown,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Button from "@/ui/Button";
import Badge from "@/ui/Badge";
import SortableTableHeader from "@/ui/SortableTableHeader";
import { Modal } from "@/ui/Modal";
import EntryAddControls from "./EntryAddControls";

type SortColumn = "entryForm" | "pronunciation" | "translations" | "type";
type SortDirection = "asc" | "desc";

interface EntryTableProps {
  entries: EntryListRowDto[];
  morphTypes: MorphTypeDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenCreate: () => void;
  onQuickAdd: (entryForm: string) => Promise<void>;
  onBulkAdd: (entryForms: string[]) => Promise<BulkCreateEntriesResult>;
  onBulkMorphTypeChange: (
    entryIds: number[],
    morphTypeId: number | null
  ) => Promise<EntryDto[]>;
  onBulkDelete: (entryIds: number[]) => Promise<void>;
  isLoading: boolean;
}

export default function EntryTable({
  entries,
  morphTypes,
  selectedId,
  onSelect,
  onOpenCreate,
  onQuickAdd,
  onBulkAdd,
  onBulkMorphTypeChange,
  onBulkDelete,
  isLoading,
}: EntryTableProps) {
  const [search, setSearch] = useState("");
  const [checkedEntryIds, setCheckedEntryIds] = useState<Set<number>>(
    () => new Set()
  );
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
    for (const mt of morphTypes) {
      map.set(mt.id, mt);
    }
    return map;
  }, [morphTypes]);

  const processedEntries = useMemo(() => {
    let result = entries;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.entryForm.toLowerCase().includes(q) ||
          (e.primaryPronunciation &&
            e.primaryPronunciation.toLowerCase().includes(q)) ||
          e.translations.some((t) => t.toLowerCase().includes(q))
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

  const visibleEntryIds = useMemo(
    () => processedEntries.map((entry) => entry.id),
    [processedEntries]
  );
  const allVisibleSelected =
    visibleEntryIds.length > 0 &&
    visibleEntryIds.every((id) => checkedEntryIds.has(id));
  const someVisibleSelected =
    visibleEntryIds.some((id) => checkedEntryIds.has(id)) &&
    !allVisibleSelected;

  useEffect(() => {
    const availableIds = new Set(entries.map((entry) => entry.id));
    setCheckedEntryIds((current) => {
      const retained = new Set(
        [...current].filter((id) => availableIds.has(id))
      );
      return retained.size === current.size ? current : retained;
    });
  }, [entries]);

  const toggleVisibleSelection = () => {
    setCheckedEntryIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleEntryIds.forEach((id) => next.delete(id));
      } else {
        visibleEntryIds.forEach((id) => next.add(id));
      }
      return next;
    });
    setBulkError("");
  };

  const toggleEntrySelection = (entryId: number) => {
    setCheckedEntryIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
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

  return (
    <div className="relative flex min-w-[380px] flex-1 flex-col border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3.5 border-b border-zinc-200/80 p-5 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Lexicon
            </h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <Button
            onClick={onOpenCreate}
            variant="primary"
            className="!h-9 !px-3.5 !text-xs !gap-1.5 shadow-xs font-medium"
          >
            <Plus size={15} />
            <span>Add word</span>
          </Button>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries, phonetics or translations…"
            className="h-10 w-full rounded-xl border border-zinc-200/80 bg-zinc-50/70 pl-10 pr-9 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:focus:border-violet-500 dark:focus:bg-zinc-900/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <EntryAddControls
        entries={entries}
        onQuickAdd={onQuickAdd}
        onBulkAdd={onBulkAdd}
      />

      <div
        className={`workspace-table-scrollbar min-h-0 flex-1 overflow-auto ${
          checkedEntryIds.size > 0 ? "pb-24" : ""
        }`}
      >
        <table className="w-full table-fixed text-left border-collapse">
          <colgroup>
            <col className="w-10" />
            <col className="w-[24%]" />
            <col className="w-[22%]" />
            <col />
            <col className="w-28" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-zinc-50 border-b border-zinc-200/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800">
            <tr className="group">
              <th className="px-3 py-3">
                <Checkbox.Root
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onCheckedChange={toggleVisibleSelection}
                  aria-label="Select all visible entries"
                  disabled={
                    visibleEntryIds.length === 0 ||
                    isBulkUpdating ||
                    isBulkDeleting
                  }
                  className={`grid size-4 cursor-pointer place-items-center rounded border border-zinc-300 bg-white text-white outline-none transition-opacity data-checked:border-violet-600 data-checked:bg-violet-600 data-indeterminate:border-violet-600 data-indeterminate:bg-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 [@media(hover:none)]:opacity-100 ${
                    checkedEntryIds.size > 0
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                  }`}
                >
                  <Checkbox.Indicator>
                    {someVisibleSelected ? (
                      <Minus size={12} strokeWidth={3} />
                    ) : (
                      <Check size={12} strokeWidth={3} />
                    )}
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </th>
              <SortableTableHeader
                label="Entry Form"
                active={sort.column === "entryForm"}
                direction={sort.direction}
                onClick={() => handleSort("entryForm")}
                className="py-3 px-5"
              />
              <SortableTableHeader
                label="Pronunciation"
                active={sort.column === "pronunciation"}
                direction={sort.direction}
                onClick={() => handleSort("pronunciation")}
                className="py-3 px-4"
              />
              <SortableTableHeader
                label="Translations"
                active={sort.column === "translations"}
                direction={sort.direction}
                onClick={() => handleSort("translations")}
                className="py-3 px-4"
              />
              <SortableTableHeader
                label="Type"
                active={sort.column === "type"}
                direction={sort.direction}
                onClick={() => handleSort("type")}
                className="py-3 px-5 text-right [&>button]:ml-auto"
              />
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {isLoading && entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-zinc-400">
                  Loading lexicon entries…
                </td>
              </tr>
            ) : processedEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <BookOpen size={30} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {search ? `No entries found matching "${search}"` : "No words recorded yet."}
                    </p>
                    {!search && (
                      <Button
                        onClick={onOpenCreate}
                        variant="secondary"
                        className="!h-8 !px-3 !text-xs !gap-1"
                      >
                        <Plus size={13} />
                        Add first word
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              processedEntries.map((entry) => {
                const isSelected = entry.id === selectedId;
                const isChecked = checkedEntryIds.has(entry.id);
                const morphType =
                  entry.morphTypeId != null ? morphTypeMap.get(entry.morphTypeId) : null;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => {
                      if (checkedEntryIds.size > 0) {
                        toggleEntrySelection(entry.id);
                      } else {
                        onSelect(entry.id);
                      }
                    }}
                    className={`group hover:cursor-pointer ${
                      isSelected
                        ? "bg-violet-50/90 text-violet-950 dark:bg-violet-950/30 dark:text-violet-100"
                        : isChecked
                          ? "bg-violet-50/50 dark:bg-violet-950/15"
                        : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <td
                      className="px-3 py-3.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox.Root
                        checked={checkedEntryIds.has(entry.id)}
                        onCheckedChange={() => toggleEntrySelection(entry.id)}
                        aria-label={`Select ${entry.entryForm}`}
                        disabled={isBulkUpdating || isBulkDeleting}
                        className={`grid size-4 cursor-pointer place-items-center rounded border border-zinc-300 bg-white text-white outline-none transition-opacity data-checked:border-violet-600 data-checked:bg-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 [@media(hover:none)]:opacity-100 ${
                          isChecked
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                        }`}
                      >
                        <Checkbox.Indicator>
                          <Check size={12} strokeWidth={3} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-serif text-[17px] tracking-wide ${
                            isSelected
                              ? "font-semibold text-violet-900 dark:text-violet-200"
                              : "font-medium text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {entry.entryForm}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {entry.primaryPronunciation ? (
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans tracking-wide">
                          /{entry.primaryPronunciation}/
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-sm max-w-[240px]">
                      {entry.translations.length > 0 ? (
                        <span className="truncate block font-normal text-zinc-700 dark:text-zinc-300">
                          {entry.translations.join("; ")}
                        </span>
                      ) : (
                        <span className="text-xs italic text-zinc-400">No definitions</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex h-7 items-center">
                        {morphType ? (
                          <Badge
                            variant="accent"
                            size="xs"
                            title={morphType.label}
                            className="max-w-full overflow-hidden"
                          >
                            <span className="truncate">{morphType.label}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {checkedEntryIds.size > 0 && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto pl-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {checkedEntryIds.size} selected
            </span>
            <Select.Root
              value={bulkMorphTypeId}
              onValueChange={setBulkMorphTypeId}
              items={[
                { value: "__none__", label: "None (Unclassified)" },
                ...morphTypes.map((morphType) => ({
                  value: String(morphType.id),
                  label: morphType.label,
                })),
              ]}
              disabled={isBulkUpdating || isBulkDeleting}
            >
              <Select.Trigger
                aria-label="Set morphology type for selected entries"
                className="flex h-9 w-44 items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-xs outline-none transition-colors hover:border-zinc-300 focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600"
              >
                <Select.Value placeholder="Morphology type…" />
                <Select.Icon className="shrink-0 text-zinc-400">
                  <ChevronDown size={14} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  sideOffset={6}
                  className="z-50 min-w-(--anchor-width)"
                >
                  <Select.Popup className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-2xl">
                    <Select.Item
                      value="__none__"
                      className="flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-xs text-zinc-800 outline-none transition-colors data-highlighted:bg-violet-50 data-highlighted:text-violet-900 dark:text-zinc-200 dark:data-highlighted:bg-violet-950/40 dark:data-highlighted:text-violet-200"
                    >
                      <Select.ItemText>None (Unclassified)</Select.ItemText>
                      <Select.ItemIndicator className="ml-2 text-violet-600 dark:text-violet-400">
                        <Check size={13} />
                      </Select.ItemIndicator>
                    </Select.Item>
                    {morphTypes.map((morphType) => (
                      <Select.Item
                        key={morphType.id}
                        value={String(morphType.id)}
                        className="group flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-xs text-zinc-800 outline-none transition-colors data-highlighted:bg-violet-50 data-highlighted:text-violet-900 dark:text-zinc-200 dark:data-highlighted:bg-violet-950/40 dark:data-highlighted:text-violet-200"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Select.ItemText className="truncate font-medium">
                            {morphType.label}
                          </Select.ItemText>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {morphType.code}
                          </span>
                        </span>
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
              onClick={applyBulkMorphType}
              disabled={
                isBulkUpdating ||
                isBulkDeleting ||
                bulkMorphTypeId === null
              }
              className="!h-9 !px-3 !text-xs !gap-1.5"
            >
              <Check size={14} />
              {isBulkUpdating ? "Applying…" : "Apply"}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsDeleteDialogOpen(true)}
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
                setCheckedEntryIds(new Set());
                setBulkError("");
              }}
              disabled={isBulkUpdating || isBulkDeleting}
              className="!h-9 !px-2.5 !text-xs"
            >
              Clear
            </Button>
          </div>
          {bulkError && !isDeleteDialogOpen && (
            <p
              role="alert"
              className="mt-2 px-1 text-xs text-red-600 dark:text-red-400"
            >
              {bulkError}
            </p>
          )}
        </div>
      )}
      <Modal
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isBulkDeleting) setIsDeleteDialogOpen(open);
        }}
        title={`Delete ${checkedEntryIds.size} ${
          checkedEntryIds.size === 1 ? "entry" : "entries"
        }?`}
        description="This permanently removes the selected lexicon entries, including their pronunciations and senses."
      >
        {bulkError && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {bulkError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isBulkDeleting}
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isBulkDeleting || checkedEntryIds.size === 0}
            onClick={() => void applyBulkDelete()}
          >
            {isBulkDeleting ? "Deleting…" : "Delete entries"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
