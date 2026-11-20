import { FormEvent, useMemo, useState } from "react";
import { BulkCreateEntriesResult, EntryListRowDto } from "@/api/entries";
import { Check, ListPlus, Plus, X } from "lucide-react";
import Button from "@/ui/Button";

type AddMode = "quick" | "bulk" | null;

interface EntryAddControlsProps {
  entries: EntryListRowDto[];
  onQuickAdd: (entryForm: string) => Promise<void>;
  onBulkAdd: (entryForms: string[]) => Promise<BulkCreateEntriesResult>;
}

export default function EntryAddControls({
  entries,
  onQuickAdd,
  onBulkAdd,
}: EntryAddControlsProps) {
  const [mode, setMode] = useState<AddMode>(null);
  const [quickForm, setQuickForm] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const preview = useMemo(() => {
    const seen = new Set(
      entries.map((entry) => entry.entryForm.trim().toLowerCase())
    );
    const forms: string[] = [];
    let skippedCount = 0;

    for (const line of bulkText.split(/\r?\n/)) {
      const form = line.trim();
      if (!form) continue;

      const normalized = form.toLowerCase();
      if (seen.has(normalized)) {
        skippedCount += 1;
      } else {
        seen.add(normalized);
        forms.push(form);
      }
    }

    return { forms, skippedCount };
  }, [bulkText, entries]);

  const toggleMode = (nextMode: Exclude<AddMode, null>) => {
    setMode((current) => (current === nextMode ? null : nextMode));
    setError("");
    setMessage("");
  };

  const handleQuickSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = quickForm.trim();
    if (!form || busy) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onQuickAdd(form);
      setQuickForm("");
      setMessage(`Added “${form}”.`);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (busy || preview.forms.length === 0) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await onBulkAdd(preview.forms);
      setMessage(
        `Added ${result.createdEntries.length} ${
          result.createdEntries.length === 1 ? "entry" : "entries"
        }; skipped ${result.skippedCount} ${
          result.skippedCount === 1 ? "duplicate" : "duplicates"
        }.`
      );
      setBulkText("");
      setMode(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBulk = () => {
    setBulkText("");
    setMode(null);
    setError("");
    setMessage("");
  };

  return (
    <div className="border-b border-zinc-200/80 px-5 py-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={mode === "quick" ? "secondary" : "ghost"}
          onClick={() => toggleMode("quick")}
          className="!h-8 !px-2.5 !text-xs !gap-1.5"
          aria-expanded={mode === "quick"}
        >
          <Plus size={14} />
          Quick add
        </Button>
        <Button
          type="button"
          variant={mode === "bulk" ? "secondary" : "ghost"}
          onClick={() => toggleMode("bulk")}
          className="!h-8 !px-2.5 !text-xs !gap-1.5"
          aria-expanded={mode === "bulk"}
        >
          <ListPlus size={14} />
          Bulk add
        </Button>
        {message && (
          <span
            role="status"
            className="ml-auto text-xs text-emerald-700 dark:text-emerald-400"
          >
            {message}
          </span>
        )}
      </div>

      {mode === "quick" && (
        <form
          onSubmit={handleQuickSubmit}
          className="mt-3 flex items-center gap-2"
        >
          <label className="sr-only" htmlFor="quick-entry-form">
            Entry form
          </label>
          <input
            id="quick-entry-form"
            autoFocus
            value={quickForm}
            onChange={(event) => setQuickForm(event.target.value)}
            placeholder="Type an entry and press Enter…"
            className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            disabled={busy}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={busy || !quickForm.trim()}
            className="!h-9 !px-3 !text-xs"
          >
            {busy ? "Adding…" : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="Close quick add"
            onClick={() => setMode(null)}
            disabled={busy}
            className="!h-9 !w-9 !p-0"
          >
            <X size={15} />
          </Button>
        </form>
      )}

      {mode === "bulk" && (
        <div className="mt-3">
          <label
            htmlFor="bulk-entry-forms"
            className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            One entry form per line
          </label>
          <textarea
            id="bulk-entry-forms"
            autoFocus
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"káloma\nsúren\n…"}
            rows={4}
            disabled={busy}
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 font-serif text-sm text-zinc-800 outline-none placeholder:font-sans placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <div
            role="group"
            aria-label="Bulk add preview and confirmation"
            className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2.5 dark:border-violet-900/70 dark:bg-violet-950/25"
          >
            <div className="text-xs text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">{preview.forms.length}</span>{" "}
              {preview.forms.length === 1 ? "entry" : "entries"} will be added
              {preview.skippedCount > 0 && (
                <span className="ml-2 text-amber-700 dark:text-amber-400">
                  · {preview.skippedCount}{" "}
                  {preview.skippedCount === 1 ? "duplicate" : "duplicates"} will
                  be skipped
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelBulk}
                disabled={busy}
                className="!h-8 !px-2.5 !text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleBulkSubmit}
                disabled={busy || preview.forms.length === 0}
                className="!h-8 !px-3 !text-xs !gap-1.5"
              >
                <Check size={14} />
                {busy ? "Adding…" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
