import { useState } from "react";
import Button from "@/ui/Button";
import { Modal } from "@/ui/Modal";
import getErrorMessage from "@/pages/Workspace/utils/getErrorMessage";

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}

export default function DeleteProjectDialog({
  open,
  projectName,
  onOpenChange,
  onDelete,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isDeleting) {
          setError(null);
          onOpenChange(isOpen);
        }
      }}
      title="Delete project permanently?"
      description={`This permanently deletes "${projectName}" and all files in its project folder. This action cannot be undone.`}
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
          {isDeleting ? "Deleting…" : "Delete project"}
        </Button>
      </div>
    </Modal>
  );
}
