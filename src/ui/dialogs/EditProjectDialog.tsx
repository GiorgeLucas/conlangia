import { useEffect, useState, type FormEvent } from "react";
import type { ProjectDto } from "@/api/projects";
import { Field } from "@base-ui/react";
import Button from "@/ui/Button";
import Input from "@/ui/Input";
import { Modal } from "@/ui/Modal";
import Textarea from "@/ui/Textarea";
import getErrorMessage from "@/pages/Workspace/utils/getErrorMessage";

interface EditProjectDialogProps {
  project: ProjectDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    project: ProjectDto,
    name: string,
    description: string | null
  ) => Promise<void>;
}

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSave,
}: EditProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(project?.metadata?.name ?? "");
      setDescription(project?.metadata?.description ?? "");
      setError(null);
    }
  }, [open, project]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(project, trimmedName, description.trim() || null);
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
      title="Edit project"
      description="Update the project's name and description."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="text-sm font-medium">Project name</Field.Label>
          <Field.Control
            render={
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full"
                required
                autoFocus
              />
            }
          />
        </Field.Root>

        <Field.Root>
          <Field.Label className="text-sm font-medium">
            Description <span className="text-xs text-zinc-400">(Optional)</span>
          </Field.Label>
          <Field.Control
            render={
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5"
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
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
