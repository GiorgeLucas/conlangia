import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { PronunciationDto } from "@/api/entries";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import Button from "@/ui/Button";
import SortableItem from "@/ui/SortableItem";

interface PronunciationsSectionProps {
  entryId: number;
  pronunciations: PronunciationDto[];
  isReordering: boolean;
  showAddPron: boolean;
  setShowAddPron: Dispatch<SetStateAction<boolean>>;
  newPronValue: string;
  setNewPronValue: (value: string) => void;
  newPronDesc: string;
  setNewPronDesc: (value: string) => void;
  addingPron: boolean;
  onAddPronunciation: (event: FormEvent) => void;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  onSavePronValue: (pronunciationId: number, value: string) => Promise<boolean>;
  onSavePronDescription: (
    pronunciationId: number,
    value: string
  ) => Promise<boolean>;
  onRemovePronunciation: (pronunciationId: number) => Promise<boolean>;
}

export default function PronunciationsSection({
  entryId,
  pronunciations,
  isReordering,
  showAddPron,
  setShowAddPron,
  newPronValue,
  setNewPronValue,
  newPronDesc,
  setNewPronDesc,
  addingPron,
  onAddPronunciation,
  editingField,
  setEditingField,
  onSavePronValue,
  onSavePronDescription,
  onRemovePronunciation,
}: PronunciationsSectionProps) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemovePronunciation = async (pronunciationId: number) => {
    setRemovingId(pronunciationId);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
    if (!(await onRemovePronunciation(pronunciationId))) {
      setRemovingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
          Pronunciations
        </h2>
        <button
          type="button"
          onClick={() => setShowAddPron((prev) => !prev)}
          className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition-transform transition-colors hover:text-violet-700 active:scale-95 hover:cursor-pointer dark:text-violet-400"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {pronunciations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
            No pronunciations. Click + Add to record one.
          </div>
        ) : (
          pronunciations.map((pronunciation, index) => {
            const isEditingValue =
              editingField === `pron-val-${pronunciation.id}`;
            const isEditingDescription =
              editingField === `pron-desc-${pronunciation.id}`;

            return (
              <SortableItem
                key={pronunciation.id}
                id={`pronunciation-${pronunciation.id}`}
                group={`pronunciations-${entryId}`}
                index={index}
                disabled={isReordering || removingId === pronunciation.id}
                className={`entry-detail-card group relative rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 ${
                  removingId === pronunciation.id ? "entry-detail-card-exit" : ""
                }`}
              >
                {(handleRef) => (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          ref={handleRef}
                          type="button"
                          aria-label={`Move pronunciation ${pronunciation.value}`}
                          title="Drag to reorder pronunciation"
                          disabled={isReordering}
                          className="touch-none cursor-grab rounded-sm active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed"
                        >
                          <GripVertical
                            size={14}
                            aria-hidden="true"
                            className="text-zinc-400 shrink-0 select-none"
                          />
                        </button>
                        {isEditingValue ? (
                          <div className="flex h-6 max-w-xs flex-1 items-center">
                            <input
                              key={`${pronunciation.id}-${pronunciation.value}`}
                              type="text"
                              defaultValue={pronunciation.value}
                              onBlur={async (event) => {
                                const input = event.currentTarget;
                                const value = input.value.trim();
                                if (!value || value === pronunciation.value) {
                                  input.value = pronunciation.value;
                                  setEditingField(null);
                                  return;
                                }
                                const saved = await onSavePronValue(
                                  pronunciation.id,
                                  value
                                );
                                if (!saved) input.value = pronunciation.value;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") {
                                  e.currentTarget.value = pronunciation.value;
                                  e.currentTarget.blur();
                                }
                              }}
                              autoFocus
                              className="h-6 w-full bg-transparent p-0 font-bold text-base leading-6 text-zinc-950 outline-none focus:text-violet-700 dark:text-zinc-50 dark:focus:text-violet-300 select-text"
                            />
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingField(`pron-val-${pronunciation.id}`);
                            }}
                            title="Click to edit pronunciation"
                            className="font-bold text-base leading-6 text-zinc-950 hover:cursor-pointer hover:text-violet-700 transition dark:text-zinc-100 dark:hover:text-violet-300"
                          >
                            /{pronunciation.value}/
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePronunciation(pronunciation.id)}
                        title="Remove pronunciation"
                        className="rounded p-1 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 hover:cursor-pointer dark:text-zinc-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="my-2 border-b border-zinc-200/80 ml-6 dark:border-zinc-800" />

                    <div className="ml-6">
                      {isEditingDescription ? (
                        <div className="h-5">
                          <input
                            key={`${pronunciation.id}-${pronunciation.description ?? ""}`}
                            type="text"
                            defaultValue={pronunciation.description || ""}
                            onBlur={async (event) => {
                              const input = event.currentTarget;
                              const value = input.value.trim();
                              if (value === (pronunciation.description || "")) {
                                setEditingField(null);
                                return;
                              }
                              const saved = await onSavePronDescription(
                                pronunciation.id,
                                value
                              );
                              if (!saved) {
                                input.value = pronunciation.description || "";
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") {
                                e.currentTarget.value =
                                  pronunciation.description || "";
                                e.currentTarget.blur();
                              }
                            }}
                            autoFocus
                            placeholder="Description..."
                            className="h-5 w-full max-w-sm bg-transparent p-0 text-sm leading-5 text-zinc-600 outline-none focus:text-violet-700 dark:text-zinc-300 dark:focus:text-violet-300 select-text"
                          />
                        </div>
                      ) : (
                        <p
                          onClick={() => {
                            setEditingField(`pron-desc-${pronunciation.id}`);
                          }}
                          title="Click to edit description"
                          className="h-5 text-sm leading-5 text-zinc-600 hover:cursor-pointer hover:text-zinc-950 transition dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {pronunciation.description || (
                            <span className="italic text-zinc-300 dark:text-zinc-600">
                              Add description…
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </SortableItem>
            );
          })
        )}
      </div>

      {showAddPron && (
        <form
          onSubmit={onAddPronunciation}
          className="entry-detail-form rounded-xl border border-dashed border-violet-300 bg-violet-50/20 p-3.5 space-y-2.5 dark:border-violet-900/50 dark:bg-violet-950/10"
        >
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newPronValue}
              onChange={(e) => setNewPronValue(e.target.value)}
              placeholder="Phonetic (e.g. 'e.lja) *"
              required
              autoFocus
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-800 outline-none focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="text"
              value={newPronDesc}
              onChange={(e) => setNewPronDesc(e.target.value)}
              placeholder="Description (optional)"
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-800 outline-none focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddPron(false)}
              className="!h-7 !px-2.5 !text-xs transition-transform active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={addingPron || !newPronValue.trim()}
              className="!h-7 !px-3 !text-xs !gap-1 transition-transform active:scale-95"
            >
              {addingPron ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              {addingPron ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
