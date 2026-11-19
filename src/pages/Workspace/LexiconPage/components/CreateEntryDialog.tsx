import { useState, useMemo } from "react";
import { Modal } from "@/ui/Modal";
import Input from "@/ui/Input";
import Button from "@/ui/Button";
import CustomSelect, { SelectOption } from "@/ui/Select";
import { Field } from "@base-ui/react";
import { createEntry, EntryDto } from "@/api/entries";
import { MorphTypeDto } from "@/api/morphTypes";

interface CreateEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  morphTypes: MorphTypeDto[];
  onCreated: (newEntry: EntryDto) => void;
}

export default function CreateEntryDialog({
  open,
  onOpenChange,
  morphTypes,
  onCreated,
}: CreateEntryDialogProps) {
  const [form, setForm] = useState("");
  const [morphTypeId, setMorphTypeId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const morphOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "None (Unclassified)" },
      ...morphTypes.map((mt) => ({
        value: String(mt.id),
        label: mt.label,
        badge: mt.code,
      })),
    ];
  }, [morphTypes]);

  const resetForm = () => {
    setForm("");
    setMorphTypeId(null);
    setError("");
  };

  const closeDialog = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!form.trim()) return;
    setBusy(true);
    setError("");
    try {
      const entry = await createEntry(form.trim(), morphTypeId);
      onCreated(entry);
      closeDialog();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
      title="Add new lexicon entry"
      description="Enter the word or morpheme form in your constructed language."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        className="flex flex-col gap-4"
      >
        <Field.Root>
          <Field.Label className="text-sm font-medium">Entry Form (Word)</Field.Label>
          <Field.Control
            render={
              <Input
                value={form}
                onChange={(e) => setForm(e.target.value)}
                placeholder="e.g. káloma"
                className="mt-1.5 w-full font-serif text-base"
                autoFocus
                required
              />
            }
          />
        </Field.Root>

        {morphTypes.length > 0 && (
          <Field.Root>
            <Field.Label className="text-sm font-medium">
              Morphology Type{" "}
              <span className="text-xs font-normal text-zinc-400">(Optional)</span>
            </Field.Label>
            <div className="mt-1.5">
              <CustomSelect
                value={morphTypeId ? String(morphTypeId) : ""}
                onValueChange={(val) => setMorphTypeId(val ? Number(val) : null)}
                options={morphOptions}
                placeholder="Select morphology type..."
              />
            </div>
          </Field.Root>
        )}

        {error && (
          <div className="text-sm text-red-600">
            <p>{error}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={busy || !form.trim()}
          >
            {busy ? "Adding…" : "Add Word"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
