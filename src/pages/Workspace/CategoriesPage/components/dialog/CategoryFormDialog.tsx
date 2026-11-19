import { useEffect, useState, type FormEvent } from "react";
import { CategoryDto } from "@/api/categories";
import { Field } from "@base-ui/react";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import { Modal } from "@/ui/Modal";
import Textarea from "@/ui/Textarea";
import getErrorMessage from "../../../utils/getErrorMessage";

interface CategoryFormDialogProps {
  open: boolean;
  category: CategoryDto | null;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string) => Promise<void>;
}

export default function CategoryFormDialog({
  open,
  category,
  onOpenChange,
  onSave,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setError(null);
    }
  }, [category, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmedName, description.trim());
      onOpenChange(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isSaving) onOpenChange(isOpen);
      }}
      title={category ? "Edit category" : "Create category"}
      description="Organize the grammatical meanings in your lexicon."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="text-sm font-medium">
            Category name
          </Field.Label>
          <Field.Control
            render={
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full"
                placeholder="e.g. Noun"
                required
                autoFocus
              />
            }
          />
        </Field.Root>

        <Field.Root>
          <Field.Label
            render={
              <span className="flex w-full justify-between items-center text-sm font-medium">
                Description{" "}
                <span className="text-xs text-zinc-400">(Optional)</span>
              </span>
            }
          />
          <Field.Control
            render={
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5"
                placeholder="Describe when this category is used"
                rows={3}
              />
            }
          />
        </Field.Root>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            className="dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            {isSaving
              ? "Saving…"
              : category
                ? "Save changes"
                : "Create category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
