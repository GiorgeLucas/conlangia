import { Trash2 } from "lucide-react";
import Button from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";

interface CategorySelectionBarProps {
  selectedCount: number;
  error: string | null;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onClear: () => void;
  onDelete: () => void;
}

export default function CategorySelectionBar({
  selectedCount,
  error,
  isDeleting,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  onClear,
  onDelete,
}: CategorySelectionBarProps) {
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
          <Button
            type="button"
            variant="danger"
            onClick={() => onDeleteDialogOpenChange(true)}
            disabled={isDeleting}
            className="!h-9 !px-3 !text-xs !gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={isDeleting}
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
          selectedCount === 1 ? "category" : "categories"
        }?`}
        description="Senses using these categories will become uncategorized."
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
            {isDeleting ? "Deleting…" : "Delete categories"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
