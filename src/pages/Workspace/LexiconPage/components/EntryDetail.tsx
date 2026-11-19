import { useState, useEffect, useMemo } from "react";
import {
  EntryDto,
  updateEntryForm,
  updateEntryMorphType,
  addEntryPronunciation,
  updateEntryPronunciationValue,
  updateEntryPronunciationDescription,
  removeEntryPronunciation,
  addEntrySense,
  updateEntrySenseTranslation,
  updateEntrySenseDefinition,
  updateEntrySenseCategory,
  removeEntrySense,
  deleteEntry,
} from "@/api/entries";
import { MorphTypeDto } from "@/api/morphTypes";
import { CategoryDto } from "@/api/categories";
import CustomSelect, { SelectOption } from "@/ui/Select";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  AlertCircle,
} from "lucide-react";
import Button from "@/ui/Button";

interface EntryDetailProps {
  entry: EntryDto;
  morphTypes: MorphTypeDto[];
  categories: CategoryDto[];
  onEntryUpdated: (updated: EntryDto) => void;
  onEntryDeleted: (id: number) => void;
}

export default function EntryDetail({
  entry,
  morphTypes,
  categories,
  onEntryUpdated,
  onEntryDeleted,
}: EntryDetailProps) {
  // --- Word Form Editing ---
  const [isEditingWord, setIsEditingWord] = useState(false);
  const [wordFormDraft, setWordFormDraft] = useState(entry.entryForm);

  // --- Deletion State ---
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Inline Form for Adding Pronunciation ---
  const [showAddPron, setShowAddPron] = useState(false);
  const [newPronValue, setNewPronValue] = useState("");
  const [newPronDesc, setNewPronDesc] = useState("");
  const [addingPron, setAddingPron] = useState(false);

  // --- Inline Form for Adding Sense ---
  const [showAddSense, setShowAddSense] = useState(false);
  const [newSenseTrans, setNewSenseTrans] = useState("");
  const [newSenseDef, setNewSenseDef] = useState("");
  const [newSenseCatId, setNewSenseCatId] = useState<number | null>(null);
  const [addingSense, setAddingSense] = useState(false);

  // --- Inline Editing State for Senses & Pronunciations ---
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

  // Category selection popover for a specific sense
  const [editingSenseCatId, setEditingSenseCatId] = useState<number | null>(null);

  // Morph type selection toggle
  const [isChangingMorph, setIsChangingMorph] = useState(false);

  // Reset states on entry change
  useEffect(() => {
    setWordFormDraft(entry.entryForm);
    setIsEditingWord(false);
    setConfirmDelete(false);
    setShowAddPron(false);
    setShowAddSense(false);
    setEditingField(null);
    setEditingSenseCatId(null);
    setIsChangingMorph(false);
  }, [entry.id, entry.entryForm]);

  // Options for Dropdowns
  const morphOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "No morphology type" },
      ...morphTypes.map((mt) => ({
        value: String(mt.id),
        label: mt.label,
        badge: mt.code,
      })),
    ];
  }, [morphTypes]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "", label: "No category" },
      ...categories.map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    ];
  }, [categories]);

  // Active morph type
  const activeMorphType = useMemo(() => {
    if (entry.morphTypeId == null) return null;
    return morphTypes.find((mt) => mt.id === entry.morphTypeId) ?? null;
  }, [entry.morphTypeId, morphTypes]);

  // Primary pronunciation (if any)
  const primaryPronunciation =
    entry.pronunciations.length > 0 ? entry.pronunciations[0].value : null;

  // --- Word Form Handlers ---
  const handleSaveWordForm = async () => {
    if (!wordFormDraft.trim() || wordFormDraft.trim() === entry.entryForm) {
      setWordFormDraft(entry.entryForm);
      setIsEditingWord(false);
      return;
    }
    try {
      const updated = await updateEntryForm(entry.id, wordFormDraft.trim());
      onEntryUpdated(updated);
      setIsEditingWord(false);
    } catch (err) {
      console.error("Failed to update word form:", err);
    }
  };

  const handleMorphTypeChange = async (val: string | null) => {
    const id = val ? Number(val) : null;
    try {
      const updated = await updateEntryMorphType(entry.id, id);
      onEntryUpdated(updated);
      setIsChangingMorph(false);
    } catch (err) {
      console.error("Failed to update morph type:", err);
    }
  };

  const handleDeleteEntry = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(entry.id);
      onEntryDeleted(entry.id);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setIsDeleting(false);
    }
  };

  // --- Pronunciation Handlers ---
  const handleAddPronunciation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPronValue.trim()) return;
    setAddingPron(true);
    try {
      const updated = await addEntryPronunciation(
        entry.id,
        newPronValue.trim(),
        newPronDesc.trim() ? newPronDesc.trim() : null
      );
      onEntryUpdated(updated);
      setNewPronValue("");
      setNewPronDesc("");
      setShowAddPron(false);
    } catch (err) {
      console.error("Failed to add pronunciation:", err);
    } finally {
      setAddingPron(false);
    }
  };

  const handleSavePronValue = async (pronId: number) => {
    if (!fieldDraft.trim()) {
      setEditingField(null);
      return;
    }
    try {
      const updated = await updateEntryPronunciationValue(
        entry.id,
        pronId,
        fieldDraft.trim()
      );
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to update pronunciation value:", err);
    } finally {
      setEditingField(null);
    }
  };

  const handleSavePronDesc = async (pronId: number) => {
    try {
      const updated = await updateEntryPronunciationDescription(
        entry.id,
        pronId,
        fieldDraft.trim() ? fieldDraft.trim() : null
      );
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to update pronunciation description:", err);
    } finally {
      setEditingField(null);
    }
  };

  const handleRemovePron = async (pronId: number) => {
    try {
      const updated = await removeEntryPronunciation(entry.id, pronId);
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to remove pronunciation:", err);
    }
  };

  // --- Sense Handlers ---
  const handleAddSense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenseTrans.trim()) return;
    setAddingSense(true);
    try {
      const updated = await addEntrySense(
        entry.id,
        newSenseTrans.trim(),
        newSenseDef.trim() ? newSenseDef.trim() : null,
        newSenseCatId
      );
      onEntryUpdated(updated);
      setNewSenseTrans("");
      setNewSenseDef("");
      setNewSenseCatId(null);
      setShowAddSense(false);
    } catch (err) {
      console.error("Failed to add sense:", err);
    } finally {
      setAddingSense(false);
    }
  };

  const handleSaveSenseTranslation = async (senseId: number) => {
    if (!fieldDraft.trim()) {
      setEditingField(null);
      return;
    }
    try {
      const updated = await updateEntrySenseTranslation(
        entry.id,
        senseId,
        fieldDraft.trim()
      );
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to update translation:", err);
    } finally {
      setEditingField(null);
    }
  };

  const handleSaveSenseDefinition = async (senseId: number) => {
    try {
      const updated = await updateEntrySenseDefinition(
        entry.id,
        senseId,
        fieldDraft.trim() ? fieldDraft.trim() : null
      );
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to update definition:", err);
    } finally {
      setEditingField(null);
    }
  };

  const handleSenseCategoryChange = async (senseId: number, catIdVal: string | null) => {
    const catId = catIdVal ? Number(catIdVal) : null;
    try {
      const updated = await updateEntrySenseCategory(entry.id, senseId, catId);
      onEntryUpdated(updated);
      setEditingSenseCatId(null);
    } catch (err) {
      console.error("Failed to update sense category:", err);
    }
  };

  const handleRemoveSense = async (senseId: number) => {
    try {
      const updated = await removeEntrySense(entry.id, senseId);
      onEntryUpdated(updated);
    } catch (err) {
      console.error("Failed to remove sense:", err);
    }
  };

  return (
    <div className="w-full px-6 py-6 font-sans select-none">
      {/* =========================================================================
          TOP HEADER: "Lexical Entry" label, big Title, primary IPA, Morph badge & Delete
         ========================================================================= */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Lexical Entry
          </span>

          {/* Word title with click-to-edit */}
          {isEditingWord ? (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={wordFormDraft}
                onChange={(e) => setWordFormDraft(e.target.value)}
                onBlur={handleSaveWordForm}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveWordForm();
                  if (e.key === "Escape") {
                    setWordFormDraft(entry.entryForm);
                    setIsEditingWord(false);
                  }
                }}
                autoFocus
                className="rounded-lg border border-violet-500 bg-white px-2.5 py-0.5 font-serif text-3xl font-bold tracking-tight text-zinc-950 outline-none ring-2 ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-50 select-text"
              />
              <button
                type="button"
                onClick={handleSaveWordForm}
                className="rounded-md p-1.5 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setIsEditingWord(true)}
              title="Click to rename"
              className="font-serif text-4xl font-bold tracking-tight text-zinc-950 hover:cursor-pointer hover:opacity-85 transition dark:text-zinc-50"
            >
              {entry.entryForm}
            </h1>
          )}

          {/* Primary IPA */}
          {primaryPronunciation && (
            <p className="text-base text-zinc-700 dark:text-zinc-300 font-sans tracking-wide">
              /{primaryPronunciation}/
            </p>
          )}

          {/* Morphology Type Badge (e.g. Root) with click-to-change */}
          <div className="pt-1.5">
            {isChangingMorph ? (
              <div className="w-52">
                <CustomSelect
                  value={entry.morphTypeId ? String(entry.morphTypeId) : ""}
                  onValueChange={handleMorphTypeChange}
                  options={morphOptions}
                  placeholder="Select morph type..."
                  triggerClassName="!h-8 !text-xs !rounded-full"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsChangingMorph(true)}
                title="Click to change morph type"
                className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-medium text-[#15803d] hover:bg-[#bbf7d0] transition hover:cursor-pointer dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                {activeMorphType ? activeMorphType.label : "Set morph type..."}
              </button>
            )}
          </div>
        </div>

        {/* Top-right delete button: minimalist borderless trash icon */}
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 pt-1">
              <AlertCircle size={13} />
              <span className="font-medium">Delete entry?</span>
              <button
                type="button"
                onClick={handleDeleteEntry}
                disabled={isDeleting}
                className="font-bold underline hover:text-red-700 px-0.5 hover:cursor-pointer"
              >
                Yes
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-zinc-400 hover:text-zinc-600 px-0.5 hover:cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete lexical entry"
              className="flex items-center justify-center rounded-lg p-1.5 text-red-500 transition hover:bg-red-50/80 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/30 hover:cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Thin Horizontal Divider Line (as seen in screenshot) */}
      <hr className="my-5 border-t border-zinc-200/80 dark:border-zinc-800" />

      {/* =========================================================================
          PRONUNCIATIONS SECTION: Compact & identical to screenshot
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            Pronunciations
          </h2>
          <button
            type="button"
            onClick={() => setShowAddPron((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700 transition hover:cursor-pointer dark:text-violet-400"
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>

        {/* Existing Pronunciation Cards */}
        <div className="space-y-2.5">
          {entry.pronunciations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
              No pronunciations. Click + Add to record one.
            </div>
          ) : (
            entry.pronunciations.map((p) => {
              const isEditingVal = editingField === `pron-val-${p.id}`;
              const isEditingDesc = editingField === `pron-desc-${p.id}`;

              return (
                <div
                  key={p.id}
                  className="group relative rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                >
                  {/* Top row: Grip icon + Phonetic + Trash */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <GripVertical
                        size={14}
                        className="text-zinc-400 shrink-0 select-none"
                      />

                      {/* Click to Edit Phonetic Value */}
                      {isEditingVal ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                          <input
                            type="text"
                            value={fieldDraft}
                            onChange={(e) => setFieldDraft(e.target.value)}
                            onBlur={() => handleSavePronValue(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePronValue(p.id);
                              if (e.key === "Escape") setEditingField(null);
                            }}
                            autoFocus
                            className="h-7 w-full rounded border border-violet-500 bg-white px-2 font-bold text-base text-zinc-950 outline-none ring-1 ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-50 select-text"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePronValue(p.id)}
                            className="text-violet-600 hover:text-violet-700"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingField(`pron-val-${p.id}`);
                            setFieldDraft(p.value);
                          }}
                          title="Click to edit pronunciation"
                          className="font-bold text-base text-zinc-950 hover:cursor-pointer hover:text-violet-700 transition dark:text-zinc-100 dark:hover:text-violet-300"
                        >
                          /{p.value}/
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePron(p.id)}
                      title="Remove pronunciation"
                      className="rounded p-1 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 hover:cursor-pointer dark:text-zinc-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Subtle Inner Divider */}
                  <div className="my-2 border-b border-zinc-200/80 ml-6 dark:border-zinc-800" />

                  {/* Bottom row: Description (Click to Edit) */}
                  <div className="ml-6">
                    {isEditingDesc ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={fieldDraft}
                          onChange={(e) => setFieldDraft(e.target.value)}
                          onBlur={() => handleSavePronDesc(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSavePronDesc(p.id);
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                          placeholder="Description..."
                          className="h-7 w-full max-w-sm rounded border border-violet-500 bg-white px-2 text-sm text-zinc-600 outline-none ring-1 ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-300 select-text"
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePronDesc(p.id)}
                          className="text-violet-600 hover:text-violet-700"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <p
                        onClick={() => {
                          setEditingField(`pron-desc-${p.id}`);
                          setFieldDraft(p.description || "");
                        }}
                        title="Click to edit description"
                        className="text-sm text-zinc-600 hover:cursor-pointer hover:text-zinc-950 transition dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        {p.description || (
                          <span className="italic text-zinc-300 dark:text-zinc-600">
                            Add description…
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Pronunciation Inline Card */}
        {showAddPron && (
          <form
            onSubmit={handleAddPronunciation}
            className="rounded-xl border border-dashed border-violet-300 bg-violet-50/20 p-3.5 space-y-2.5 dark:border-violet-900/50 dark:bg-violet-950/10"
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
                className="!h-7 !px-2.5 !text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={addingPron || !newPronValue.trim()}
                className="!h-7 !px-3 !text-xs !gap-1"
              >
                <Plus size={13} />
                Save
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* =========================================================================
          SENSES SECTION: Compact & identical to screenshot
         ========================================================================= */}
      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            Senses
          </h2>
          <button
            type="button"
            onClick={() => setShowAddSense((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700 transition hover:cursor-pointer dark:text-violet-400"
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>

        {/* Existing Sense Cards */}
        <div className="space-y-3">
          {entry.senses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 dark:border-zinc-800">
              No senses recorded yet. Click + Add to create one.
            </div>
          ) : (
            entry.senses.map((s) => {
              const isEditingTrans = editingField === `sense-trans-${s.id}`;
              const isEditingDef = editingField === `sense-def-${s.id}`;
              const category = categories.find((c) => c.id === s.categoryId);
              const isChangingCat = editingSenseCatId === s.id;

              return (
                <div
                  key={s.id}
                  className="group relative rounded-xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                >
                  {/* Top row: Grip icon + Translation + Trash */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <GripVertical
                        size={14}
                        className="text-zinc-400 shrink-0 select-none"
                      />

                      {/* Click to Edit Translation */}
                      {isEditingTrans ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={fieldDraft}
                            onChange={(e) => setFieldDraft(e.target.value)}
                            onBlur={() => handleSaveSenseTranslation(s.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveSenseTranslation(s.id);
                              if (e.key === "Escape") setEditingField(null);
                            }}
                            autoFocus
                            className="h-7 w-full rounded border border-violet-500 bg-white px-2 font-bold text-base text-zinc-950 outline-none ring-1 ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-50 select-text"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSenseTranslation(s.id)}
                            className="text-violet-600 hover:text-violet-700"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingField(`sense-trans-${s.id}`);
                            setFieldDraft(s.translation);
                          }}
                          title="Click to edit translation"
                          className="font-bold text-base text-zinc-950 hover:cursor-pointer hover:text-violet-700 transition dark:text-zinc-100 dark:hover:text-violet-300"
                        >
                          {s.translation}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSense(s.id)}
                      title="Remove sense"
                      className="rounded p-1 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 hover:cursor-pointer dark:text-zinc-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Subtle Inner Divider */}
                  <div className="my-2.5 border-b border-zinc-200/80 ml-6 dark:border-zinc-800" />

                  {/* Definition row (Click to Edit) */}
                  <div className="ml-6 space-y-3">
                    {isEditingDef ? (
                      <div className="flex items-start gap-1.5">
                        <textarea
                          value={fieldDraft}
                          onChange={(e) => setFieldDraft(e.target.value)}
                          onBlur={() => handleSaveSenseDefinition(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveSenseDefinition(s.id);
                            }
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                          rows={2}
                          className="w-full rounded border border-violet-500 bg-white p-2 text-sm text-zinc-700 outline-none ring-1 ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-300 select-text"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSenseDefinition(s.id)}
                          className="text-violet-600 hover:text-violet-700 pt-1"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <p
                        onClick={() => {
                          setEditingField(`sense-def-${s.id}`);
                          setFieldDraft(s.definition || "");
                        }}
                        title="Click to edit definition"
                        className="text-sm text-zinc-600 hover:cursor-pointer hover:text-zinc-950 transition dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        {s.definition || (
                          <span className="italic text-zinc-300 dark:text-zinc-600">
                            Click to add definition…
                          </span>
                        )}
                      </p>
                    )}

                    {/* Category Pill Badge (like "Noun" in user's image) */}
                    <div>
                      {isChangingCat ? (
                        <div className="w-48">
                          <CustomSelect
                            value={s.categoryId ? String(s.categoryId) : ""}
                            onValueChange={(catVal) =>
                              handleSenseCategoryChange(s.id, catVal)
                            }
                            options={categoryOptions}
                            placeholder="Select category..."
                            triggerClassName="!h-7 !text-xs !rounded-full"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingSenseCatId(s.id)}
                          title="Click to change category"
                          className="inline-flex items-center rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-medium text-[#6d28d9] hover:bg-[#ddd6fe] transition hover:cursor-pointer dark:bg-violet-950/60 dark:text-violet-300"
                        >
                          {category ? category.name : "+ Category"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Sense Inline Card */}
        {showAddSense && (
          <form
            onSubmit={handleAddSense}
            className="rounded-xl border border-dashed border-violet-300 bg-violet-50/20 p-4 space-y-3 dark:border-violet-900/50 dark:bg-violet-950/10"
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
                  onValueChange={(val) => setNewSenseCatId(val ? Number(val) : null)}
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
                className="!h-7 !px-2.5 !text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={addingSense || !newSenseTrans.trim()}
                className="!h-7 !px-3 !text-xs !gap-1"
              >
                <Plus size={13} />
                Save Sense
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
