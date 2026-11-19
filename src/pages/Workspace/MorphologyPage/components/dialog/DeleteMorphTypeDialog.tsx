import { useState } from "react";
import type { MorphTypeDto } from "@/api/morphTypes";
import Button from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import getErrorMessage from "../../../utils/getErrorMessage";

interface DeleteMorphTypeDialogProps {
  morphType: MorphTypeDto | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (morphType: MorphTypeDto) => Promise<void>;
}

export default function DeleteMorphTypeDialog({
  morphType,
  onOpenChange,
  onDelete,
}: DeleteMorphTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!morphType) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(morphType);
      onOpenChange(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={morphType !== null}
      onOpenChange={(open) => {
        if (!isDeleting) {
          setError(null);
          onOpenChange(open);
        }
      }}
      title="Delete morphology type?"
      description={
        morphType
          ? `This will delete "${morphType.label}" (${morphType.code}). Entries using this type will no longer have a morphology type assigned.`
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
          {isDeleting ? "Deleting…" : "Delete type"}
        </Button>
      </div>
    </Modal>
  );
}
