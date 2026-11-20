import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { CategoryDto } from "@/features/categories/api/categories";
import { SenseDto } from "@/features/lexicon/api/entries";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import Button from "@/shared/components/Button";
import CustomSelect, { SelectOption } from "@/shared/components/Select";
import Badge from "@/shared/components/Badge";
import SortableItem from "@/shared/components/SortableItem";

interface SensesSectionProps {
  entryId: number;
  senses: SenseDto[];
  isReordering: boolean;
  categories: CategoryDto[];
  categoryOptions: SelectOption[];
  showAddSense: boolean;
  setShowAddSense: Dispatch<SetStateAction<boolean>>;
  newSenseTrans: string;
  setNewSenseTrans: (value: string) => void;
  newSenseDef: string;
  setNewSenseDef: (value: string) => void;
  newSenseCatId: number | null;
  setNewSenseCatId: (value: number | null) => void;
  addingSense: boolean;
  onAddSense: (event: FormEvent) => void;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  editingSenseCatId: number | null;
  setEditingSenseCatId: (senseId: number | null) => void;
  onSaveSenseTranslation: (senseId: number, value: string) => Promise<boolean>;
  onSaveSenseDefinition: (senseId: number, value: string) => Promise<boolean>;
  onChangeSenseCategory: (
    senseId: number,
    categoryId: string | null
  ) => void;
  onRemoveSense: (senseId: number) => Promise<boolean>;
}

export default function SensesSection({
  entryId,
  senses,
  isReordering,
  categories,
  categoryOptions,
  showAddSense,
  setShowAddSense,
  newSenseTrans,
  setNewSenseTrans,
  newSenseDef,
  setNewSenseDef,
  newSenseCatId,
  setNewSenseCatId,
  addingSense,
  onAddSense,
  editingField,
  setEditingField,
  editingSenseCatId,
  setEditingSenseCatId,
  onSaveSenseTranslation,
  onSaveSenseDefinition,
  onChangeSenseCategory,
  onRemoveSense,
}: SensesSectionProps) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemoveSense = async (senseId: number) => {
    setRemovingId(senseId);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
    if (!(await onRemoveSense(senseId))) {
      setRemovingId(null);
    }
  };

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
          Senses
        </h2>
        <button
          type="button"
          onClick={() => setShowAddSense((prev) => !prev)}
          className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition-transform transition-colors hover:text-violet-700 active:scale-95 hover:cursor-pointer dark:text-violet-400"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      <div className="space-y-3">
        {senses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
            No senses recorded yet. Click + Add to create one.
          </div>
        ) : (
          senses.map((sense, index) => {
            const isEditingTranslation =
              editingField === `sense-trans-${sense.id}`;
            const isEditingDefinition =
              editingField === `sense-def-${sense.id}`;
            const category = categories.find(
              (item) => item.id === sense.categoryId
            );
            const isChangingCategory = editingSenseCatId === sense.id;

            return (
              <SortableItem
                key={sense.id}
                id={`sense-${sense.id}`}
                group={`senses-${entryId}`}
                index={index}
                disabled={isReordering || removingId === sense.id}
                className={`entry-detail-card group relative rounded-xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 ${
                  removingId === sense.id ? "entry-detail-card-exit" : ""
                }`}
              >
                {(handleRef) => (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          ref={handleRef}
                          type="button"
                          aria-label={`Move sense ${sense.translation}`}
                          title="Drag to reorder sense"
                          disabled={isReordering}
                          className="touch-none cursor-grab rounded-sm active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed"
                        >
                          <GripVertical
                            size={14}
                            aria-hidden="true"
                            className="text-zinc-400 shrink-0 select-none"
                          />
                        </button>
                        {isEditingTranslation ? (
                          <div className="flex h-6 max-w-sm flex-1 items-center">
                            <input
                              key={`${sense.id}-${sense.translation}`}
                              type="text"
                              defaultValue={sense.translation}
                              onBlur={async (event) => {
                                const input = event.currentTarget;
                                const value = input.value.trim();
                                if (!value || value === sense.translation) {
                                  input.value = sense.translation;
                                  setEditingField(null);
                                  return;
                                }
                                const saved = await onSaveSenseTranslation(
                                  sense.id,
                                  value
                                );
                                if (!saved) input.value = sense.translation;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") {
                                  e.currentTarget.value = sense.translation;
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
                              setEditingField(`sense-trans-${sense.id}`);
                            }}
                            title="Click to edit translation"
                            className="font-bold text-base leading-6 text-zinc-950 hover:cursor-pointer hover:text-violet-700 transition dark:text-zinc-100 dark:hover:text-violet-300"
                          >
                            {sense.translation}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSense(sense.id)}
                        title="Remove sense"
                        className="rounded p-1 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 hover:cursor-pointer dark:text-zinc-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="my-2.5 border-b border-zinc-200/80 ml-6 dark:border-zinc-800" />

                    <div className="ml-6 space-y-3">
                        {isEditingDefinition ? (
                          <div className="flex h-5 items-center">
                            <input
                              key={`${sense.id}-${sense.definition ?? ""}`}
                              type="text"
                              defaultValue={sense.definition || ""}
                              onBlur={async (event) => {
                                const input = event.currentTarget;
                                const value = input.value.trim();
                                if (value === (sense.definition || "")) {
                                  setEditingField(null);
                                  return;
                                }
                                const saved = await onSaveSenseDefinition(
                                  sense.id,
                                  value
                                );
                                if (!saved) input.value = sense.definition || "";
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") {
                                  e.currentTarget.value = sense.definition || "";
                                  e.currentTarget.blur();
                                }
                              }}
                              autoFocus
                              className="block h-5 w-full bg-transparent p-0 text-sm leading-5 text-zinc-700 outline-none focus:text-violet-700 dark:text-zinc-300 dark:focus:text-violet-300 select-text"
                            />
                          </div>
                        ) : (
                          <p
                            onClick={() => {
                              setEditingField(`sense-def-${sense.id}`);
                            }}
                            title="Click to edit definition"
                            className="h-5 text-sm leading-5 text-zinc-600 hover:cursor-pointer hover:text-zinc-950 transition dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            {sense.definition || (
                              <span className="italic text-zinc-300 dark:text-zinc-600">
                                Click to add definition…
                              </span>
                            )}
                          </p>
                        )}

                        <div className="flex h-6 items-center">
                          {isChangingCategory ? (
                            <div className="w-48">
                              <CustomSelect
                                value={
                                  sense.categoryId
                                    ? String(sense.categoryId)
                                    : ""
                                }
                                onValueChange={(categoryValue) =>
                                  onChangeSenseCategory(sense.id, categoryValue)
                                }
                                options={categoryOptions}
                                placeholder="Select category..."
                                defaultOpen
                                triggerClassName="!h-6 !text-xs !rounded-full"
                              />
                            </div>
                          ) : (
                            <Badge
                              variant="accent"
                              size="xs"
                              onClick={() => setEditingSenseCatId(sense.id)}
                              title="Click to change category"
                            >
                              {category ? category.name : "+ Category"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </SortableItem>
            );
          })
        )}
      </div>

      {showAddSense && (
        <form
          onSubmit={onAddSense}
          className="entry-detail-form rounded-xl border border-dashed border-violet-300 bg-violet-50/20 p-4 space-y-3 dark:border-violet-900/50 dark:bg-violet-950/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newSenseTrans}
                onChange={(e) => setNewSenseTrans(e.target.value)}
                placeholder="Translation (e.g. dawn, daybreak) *"
                required
                autoFocus
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-800 outline-none focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <CustomSelect
                value={newSenseCatId ? String(newSenseCatId) : ""}
                onValueChange={(value) =>
                  setNewSenseCatId(value ? Number(value) : null)
                }
                options={categoryOptions}
                placeholder="Category..."
                triggerClassName="!h-8 !text-xs !rounded-lg"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newSenseDef}
                onChange={(e) => setNewSenseDef(e.target.value)}
                placeholder="Definition (e.g. The first light visible before sunrise)"
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-800 outline-none focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddSense(false)}
              className="!h-7 !px-2.5 !text-xs transition-transform active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={addingSense || !newSenseTrans.trim()}
              className="!h-7 !px-3 !text-xs !gap-1 transition-transform active:scale-95"
            >
              {addingSense ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              {addingSense ? "Saving..." : "Save Sense"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
