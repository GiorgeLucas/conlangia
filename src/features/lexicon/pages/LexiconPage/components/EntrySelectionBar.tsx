import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import type { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import Button from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";

interface EntrySelectionBarProps {
  selectedCount: number;
  morphTypes: MorphTypeDto[];
  morphTypeId: string | null;
  onMorphTypeChange: (value: string | null) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string;
  onApplyMorphType: () => void;
  onRequestDelete: () => void;
  onClear: () => void;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export default function EntrySelectionBar({
  selectedCount,
  morphTypes,
  morphTypeId,
  onMorphTypeChange,
  isUpdating,
  isDeleting,
  error,
  onApplyMorphType,
  onRequestDelete,
  onClear,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  onDelete,
}: EntrySelectionBarProps) {
  return (
    <>
      {selectedCount > 0 && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto pl-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {selectedCount} selected
          </span>
          <Select.Root
            value={morphTypeId}
            onValueChange={onMorphTypeChange}
            items={[
              { value: "__none__", label: "None (Unclassified)" },
              ...morphTypes.map((morphType) => ({
                value: String(morphType.id),
                label: morphType.label,
              })),
            ]}
            disabled={isUpdating || isDeleting}
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
            onClick={onApplyMorphType}
            disabled={isUpdating || isDeleting || morphTypeId === null}
            className="!h-9 !px-3 !text-xs !gap-1.5"
          >
            <Check size={14} />
            {isUpdating ? "Applying…" : "Apply"}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onRequestDelete}
            disabled={isUpdating || isDeleting}
            className="!h-9 !px-3 !text-xs !gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={isUpdating || isDeleting}
            className="!h-9 !px-2.5 !text-xs"
          >
            Clear
          </Button>
        </div>
        {error && !deleteDialogOpen && (
          <p role="alert" className="mt-2 px-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        </div>
      )}
      <Modal
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) onDeleteDialogOpenChange(open);
        }}
        title={`Delete ${selectedCount} ${
          selectedCount === 1 ? "entry" : "entries"
        }?`}
        description="This permanently removes the selected lexicon entries, including their pronunciations and senses."
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            onClick={() => onDeleteDialogOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isDeleting || selectedCount === 0}
            onClick={onDelete}
          >
            {isDeleting ? "Deleting…" : "Delete entries"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
