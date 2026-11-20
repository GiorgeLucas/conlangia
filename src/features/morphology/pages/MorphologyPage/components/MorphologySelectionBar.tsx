import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import Button from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";

interface MorphologySelectionBarProps {
  selectedCount: number;
  error: string | null;
  form: string | null;
  onFormChange: (value: string | null) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  onApply: () => void;
  onClear: () => void;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export default function MorphologySelectionBar({
  selectedCount,
  error,
  form,
  onFormChange,
  isUpdating,
  isDeleting,
  onApply,
  onClear,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  onDelete,
}: MorphologySelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <>
      <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-zinc-200/90 bg-white/95 p-3 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto pl-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {selectedCount} selected
          </span>
          <Select.Root
            value={form}
            onValueChange={onFormChange}
            items={[
              { value: "free", label: "Free" },
              { value: "bound", label: "Bound" },
            ]}
            disabled={isUpdating || isDeleting}
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
            onClick={onApply}
            disabled={form === null || isUpdating || isDeleting}
            className="!h-9 !px-3 !text-xs !gap-1.5"
          >
            <Check size={14} />
            {isUpdating ? "Applying…" : "Apply"}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onDeleteDialogOpenChange(true)}
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
      </div>
      <Modal
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) onDeleteDialogOpenChange(open);
        }}
        title={`Delete ${selectedCount} ${
          selectedCount === 1 ? "morphology type" : "morphology types"
        }?`}
        description="Entries using these types will no longer have a morphology type assigned."
      >
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
            {isDeleting ? "Deleting…" : "Delete types"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
