import { useEffect, useState, type FormEvent } from "react";
import type { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import { Checkbox, Field } from "@base-ui/react";
import { Check } from "lucide-react";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import getErrorMessage from "@/shared/utils/getErrorMessage";

interface MorphTypeFormDialogProps {
  open: boolean;
  morphType: MorphTypeDto | null;
  onOpenChange: (open: boolean) => void;
  onSave: (code: string, label: string, isBound: boolean) => Promise<void>;
}

export default function MorphTypeFormDialog({
  open,
  morphType,
  onOpenChange,
  onSave,
}: MorphTypeFormDialogProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [isBound, setIsBound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode(morphType?.code ?? "");
      setLabel(morphType?.label ?? "");
      setIsBound(morphType?.isBound ?? false);
      setError(null);
    }
  }, [morphType, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedLabel = label.trim();
    if (!trimmedCode || !trimmedLabel) {
      setError("Code and label cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmedCode, trimmedLabel, isBound);
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
      title={morphType ? "Edit morphology type" : "Create type"}
      description="Define a code and label for a morphological form."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="text-sm font-medium">Code</Field.Label>
          <Field.Control
            render={
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1.5 w-full"
                placeholder="e.g. root"
                required
                autoFocus
              />
            }
          />
        </Field.Root>

        <Field.Root>
          <Field.Label className="text-sm font-medium">Label</Field.Label>
          <Field.Control
            render={
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="mt-1.5 w-full"
                placeholder="e.g. Root"
                required
              />
            }
          />
        </Field.Root>

        <Field.Root>
          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <Checkbox.Root
              checked={isBound}
              onCheckedChange={(checked) => setIsBound(checked)}
              className="group mt-0.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded border border-zinc-300 bg-white text-white outline-none data-checked:border-violet-600 data-checked:bg-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-900"
            >
              <Checkbox.Indicator>
                <Check size={12} strokeWidth={3} />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <div>
              <Field.Label className="block cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Bound form
              </Field.Label>
              <Field.Description className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                Mark forms that cannot appear independently.
              </Field.Description>
            </div>
          </div>
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
          <Button
            type="submit"
            disabled={isSaving || !code.trim() || !label.trim()}
          >
            {isSaving
              ? "Saving…"
              : morphType
                ? "Save changes"
                : "Create type"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
