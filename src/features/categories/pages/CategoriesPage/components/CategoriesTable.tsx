import { AlertCircle, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { CategoryDto } from "@/features/categories/api/categories";
import Button from "@/shared/components/Button";
import SortableTableHeader from "@/shared/components/SortableTableHeader";
import TableSelectionCheckbox from "@/shared/components/TableSelectionCheckbox";

export type CategorySortColumn = "name" | "description";

interface CategoriesTableProps {
  categories: CategoryDto[];
  isLoading: boolean;
  loadError: string | null;
  search: string;
  sort: { column: CategorySortColumn; direction: "asc" | "desc" };
  onSort: (column: CategorySortColumn) => void;
  onRetry: () => void;
  onAdd: () => void;
  selectedIds: Set<number>;
  visibleIds: number[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleVisible: () => void;
  onToggleSelected: (id: number) => void;
  isDeleting: boolean;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

export default function CategoriesTable({
  categories,
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
  isDeleting,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  return (
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
                onChange={onToggleVisible}
                label="Select all visible categories"
                disabled={visibleIds.length === 0 || isDeleting}
                visible={selectedIds.size > 0}
              />
            </th>
            <SortableTableHeader
              label="Category"
              active={sort.column === "name"}
              direction={sort.direction}
              onClick={() => onSort("name")}
              className="px-5 py-3"
            />
            <SortableTableHeader
              label="Description"
              active={sort.column === "description"}
              direction={sort.direction}
              onClick={() => onSort("description")}
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
                    onClick={onRetry}
                    className="!h-8 !px-3 !text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Try again
                  </Button>
                </div>
              </td>
            </tr>
          ) : categories.length === 0 ? (
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
                      onClick={onAdd}
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
            categories.map((category) => (
              <tr
                key={category.id}
                onClick={() => {
                  if (selectedIds.size > 0) onToggleSelected(category.id);
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
                    onChange={() => onToggleSelected(category.id)}
                    label={`Select ${category.name}`}
                    disabled={isDeleting}
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
                    <span
                      className="block truncate"
                      title={category.description}
                    >
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
                      disabled={isDeleting}
                      onClick={() => onEdit(category)}
                      title="Edit category"
                      aria-label={`Edit ${category.name}`}
                      className="!h-auto !rounded-md !p-2 !text-zinc-400 hover:!bg-violet-50 hover:!text-violet-700 dark:hover:!bg-violet-950/40 dark:hover:!text-violet-300"
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={() => onDelete(category)}
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
  );
}
