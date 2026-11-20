import { AlertCircle, Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import type { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import SortableTableHeader from "@/shared/components/SortableTableHeader";
import TableSelectionCheckbox from "@/shared/components/TableSelectionCheckbox";

export type MorphologySortColumn = "code" | "label" | "form";
export type SortDirection = "asc" | "desc";

interface MorphologyTableProps {
  morphTypes: MorphTypeDto[];
  isLoading: boolean;
  loadError: string | null;
  search: string;
  sort: { column: MorphologySortColumn; direction: SortDirection };
  onSort: (column: MorphologySortColumn) => void;
  onRetry: () => void;
  onAdd: () => void;
  selectedIds: Set<number>;
  visibleIds: number[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleVisible: () => void;
  onToggleSelected: (id: number) => void;
  isBusy: boolean;
  onEdit: (morphType: MorphTypeDto) => void;
  onDelete: (morphType: MorphTypeDto) => void;
}

export default function MorphologyTable({
  morphTypes,
  isLoading,
  loadError,
  search,
  sort,
  onSort,
  onRetry,
  onAdd,
  selectedIds,
  visibleIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleVisible,
  onToggleSelected,
  isBusy,
  onEdit,
  onDelete,
}: MorphologyTableProps) {
  return (
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
                onChange={onToggleVisible}
                label="Select all visible morphology types"
                disabled={visibleIds.length === 0 || isBusy}
                visible={selectedIds.size > 0}
              />
            </th>
            <SortableTableHeader
              label="Code"
              active={sort.column === "code"}
              direction={sort.direction}
              onClick={() => onSort("code")}
              className="px-5 py-3"
            />
            <SortableTableHeader
              label="Label"
              active={sort.column === "label"}
              direction={sort.direction}
              onClick={() => onSort("label")}
              className="px-4 py-3"
            />
            <SortableTableHeader
              label="Form"
              active={sort.column === "form"}
              direction={sort.direction}
              onClick={() => onSort("form")}
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
                    onClick={onRetry}
                    className="!h-8 !px-3 !text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Try again
                  </Button>
                </div>
              </td>
            </tr>
          ) : morphTypes.length === 0 ? (
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
                      onClick={onAdd}
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
            morphTypes.map((morphType) => (
              <tr
                key={morphType.id}
                onClick={() => onToggleSelected(morphType.id)}
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
                      onToggleSelected(morphType.id);
                    }
                  }}
                >
                  <TableSelectionCheckbox
                    checked={selectedIds.has(morphType.id)}
                    onChange={() => onToggleSelected(morphType.id)}
                    label={`Select ${morphType.label}`}
                    disabled={isBusy}
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
                      disabled={isBusy}
                      onClick={() => onEdit(morphType)}
                      title="Edit morphology type"
                      aria-label={`Edit ${morphType.label}`}
                      className="!h-auto !rounded-md !p-2 !text-zinc-400 hover:!bg-violet-50 hover:!text-violet-700 dark:hover:!bg-violet-950/40 dark:hover:!text-violet-300"
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => onDelete(morphType)}
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
  );
}
