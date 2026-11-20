import { useState } from "react";
import type { CategoryDto } from "@/features/categories/api/categories";
import Button from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";
import getErrorMessage from "@/shared/utils/getErrorMessage";

interface DeleteCategoryDialogProps {
  category: CategoryDto | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (category: CategoryDto) => Promise<void>;
}

export default function DeleteCategoryDialog({
  category,
  onOpenChange,
  onDelete,
}: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!category) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(category);
      onOpenChange(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={category !== null}
      onOpenChange={(open) => {
        if (!isDeleting) {
          setError(null);
          onOpenChange(open);
        }
      }}
      title="Delete category?"
      description={
        category
          ? `This will delete "${category.name}". Senses using this category will become uncategorized.`
          : undefined
      }
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
          className="dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
        >
          {isDeleting ? "Deleting…" : "Delete category"}
        </Button>
      </div>
    </Modal>
  );
}
