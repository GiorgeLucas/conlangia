import { useState, useEffect, useMemo, useRef } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";
import {
  EntryDto,
  updateEntryForm,
  updateEntryMorphType,
  addEntryPronunciation,
  updateEntryPronunciationValue,
  updateEntryPronunciationDescription,
  removeEntryPronunciation,
  moveEntryPronunciation,
  addEntrySense,
  updateEntrySenseTranslation,
  updateEntrySenseDefinition,
  updateEntrySenseCategory,
  removeEntrySense,
  moveEntrySense,
  deleteEntry,
} from "@/api/entries";
import { MorphTypeDto } from "@/api/morphTypes";
import { CategoryDto } from "@/api/categories";
import { SelectOption } from "@/ui/Select";
import EntryDetailHeader from "./EntryDetailHeader";
import PronunciationsSection from "./PronunciationsSection";
import SensesSection from "./SensesSection";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddPron, setShowAddPron] = useState(false);
  const [newPronValue, setNewPronValue] = useState("");
  const [newPronDesc, setNewPronDesc] = useState("");
  const [addingPron, setAddingPron] = useState(false);

  const [showAddSense, setShowAddSense] = useState(false);
  const [newSenseTrans, setNewSenseTrans] = useState("");
  const [newSenseDef, setNewSenseDef] = useState("");
  const [newSenseCatId, setNewSenseCatId] = useState<number | null>(null);
  const [addingSense, setAddingSense] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingSenseCatId, setEditingSenseCatId] = useState<number | null>(
    null
  );
  const [isChangingMorph, setIsChangingMorph] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const headerSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfirmDelete(false);
    setShowAddPron(false);
    setShowAddSense(false);
    setEditingField(null);
    setEditingSenseCatId(null);
    setIsChangingMorph(false);
    setReorderError(null);
  }, [entry.id, entry.entryForm]);

  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entryObserver]) => setIsHeaderScrolled(!entryObserver.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

  const activeMorphType = useMemo(() => {
    if (entry.morphTypeId == null) return null;
    return morphTypes.find((mt) => mt.id === entry.morphTypeId) ?? null;
  }, [entry.morphTypeId, morphTypes]);

  const primaryPronunciation =
    entry.pronunciations.length > 0 ? entry.pronunciations[0].value : null;

  const handleSaveWordForm = async (value: string): Promise<boolean> => {
    try {
      const updated = await updateEntryForm(entry.id, value);
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to update word form:", err);
      return false;
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

  const handleSavePronValue = async (pronId: number, value: string) => {
    const pronunciation = entry.pronunciations.find((item) => item.id === pronId);
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === pronunciation?.value) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntryPronunciationValue(
        entry.id,
        pronId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to update pronunciation value:", err);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const handleSavePronDesc = async (pronId: number, value: string) => {
    const pronunciation = entry.pronunciations.find((item) => item.id === pronId);
    const trimmedValue = value.trim() || null;
    if (trimmedValue === (pronunciation?.description || null)) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntryPronunciationDescription(
        entry.id,
        pronId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to update pronunciation description:", err);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const handleRemovePron = async (pronId: number): Promise<boolean> => {
    try {
      const updated = await removeEntryPronunciation(entry.id, pronId);
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to remove pronunciation:", err);
      return false;
    }
  };

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

  const handleSaveSenseTranslation = async (senseId: number, value: string) => {
    const sense = entry.senses.find((item) => item.id === senseId);
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === sense?.translation) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntrySenseTranslation(
        entry.id,
        senseId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to update translation:", err);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const handleSaveSenseDefinition = async (senseId: number, value: string) => {
    const sense = entry.senses.find((item) => item.id === senseId);
    const trimmedValue = value.trim() || null;
    if (trimmedValue === (sense?.definition || null)) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntrySenseDefinition(
        entry.id,
        senseId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to update definition:", err);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const handleSenseCategoryChange = async (
    senseId: number,
    catIdVal: string | null
  ) => {
    const catId = catIdVal ? Number(catIdVal) : null;
    try {
      const updated = await updateEntrySenseCategory(entry.id, senseId, catId);
      onEntryUpdated(updated);
      setEditingSenseCatId(null);
    } catch (err) {
      console.error("Failed to update sense category:", err);
    }
  };

  const handleRemoveSense = async (senseId: number): Promise<boolean> => {
    try {
      const updated = await removeEntrySense(entry.id, senseId);
      onEntryUpdated(updated);
      return true;
    } catch (err) {
      console.error("Failed to remove sense:", err);
      return false;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const operation = event.operation;
    if (event.canceled || !isSortableOperation(operation)) return;

    const { source, target } = operation;
    if (
      !source ||
      !target ||
      source.initialGroup !== target.group ||
      source.initialIndex === target.index
    ) {
      return;
    }

    const sourceId =
      typeof source.id === "string" ? source.id : String(source.id);
    const newPosition = target.index + 1;
    setReorderError(null);
    setIsReordering(true);

    try {
      const pronunciationPrefix = "pronunciation-";
      if (
        source.initialGroup === `pronunciations-${entry.id}` &&
        sourceId.startsWith(pronunciationPrefix)
      ) {
        const pronunciationId = Number(
          sourceId.slice(pronunciationPrefix.length)
        );
        if (!Number.isSafeInteger(pronunciationId) || pronunciationId <= 0) {
          return;
        }
        onEntryUpdated(
          await moveEntryPronunciation(
            entry.id,
            pronunciationId,
            newPosition
          )
        );
        return;
      }

      const sensePrefix = "sense-";
      if (
        source.initialGroup === `senses-${entry.id}` &&
        sourceId.startsWith(sensePrefix)
      ) {
        const senseId = Number(sourceId.slice(sensePrefix.length));
        if (!Number.isSafeInteger(senseId) || senseId <= 0) return;
        onEntryUpdated(
          await moveEntrySense(entry.id, senseId, newPosition)
        );
      }
    } catch (err) {
      console.error("Failed to reorder entry details:", err);
      setReorderError("Could not save the new order. Please try again.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="relative w-full px-6 py-6 font-sans select-none">
        <div
          ref={headerSentinelRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-px w-px"
        />
        <div
          className={`sticky top-0 z-20 -mx-6 -mt-6 bg-white px-6 pt-6 transition-[box-shadow] duration-200 dark:bg-zinc-950 ${
            isHeaderScrolled
              ? "shadow-[0_8px_14px_-14px_rgba(24,24,27,0.65)] dark:shadow-[0_8px_14px_-14px_rgba(0,0,0,0.9)]"
              : ""
          }`}
        >
          <EntryDetailHeader
            entry={entry}
            primaryPronunciation={primaryPronunciation}
            activeMorphType={activeMorphType}
            morphOptions={morphOptions}
            onSaveWordForm={handleSaveWordForm}
            isChangingMorph={isChangingMorph}
            setIsChangingMorph={setIsChangingMorph}
            onMorphTypeChange={handleMorphTypeChange}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            isDeleting={isDeleting}
            onDelete={handleDeleteEntry}
          />
        </div>
        <div key={entry.id} className="entry-detail-content">
          {reorderError && (
            <p
              role="alert"
              className="mb-3 text-sm text-red-600 dark:text-red-400"
            >
              {reorderError}
            </p>
          )}
          <PronunciationsSection
            entryId={entry.id}
            pronunciations={entry.pronunciations}
            isReordering={isReordering}
            showAddPron={showAddPron}
            setShowAddPron={setShowAddPron}
            newPronValue={newPronValue}
            setNewPronValue={setNewPronValue}
            newPronDesc={newPronDesc}
            setNewPronDesc={setNewPronDesc}
            addingPron={addingPron}
            onAddPronunciation={handleAddPronunciation}
            editingField={editingField}
            setEditingField={setEditingField}
            onSavePronValue={handleSavePronValue}
            onSavePronDescription={handleSavePronDesc}
            onRemovePronunciation={handleRemovePron}
          />
          <SensesSection
            entryId={entry.id}
            senses={entry.senses}
            isReordering={isReordering}
            categories={categories}
            categoryOptions={categoryOptions}
            showAddSense={showAddSense}
            setShowAddSense={setShowAddSense}
            newSenseTrans={newSenseTrans}
            setNewSenseTrans={setNewSenseTrans}
            newSenseDef={newSenseDef}
            setNewSenseDef={setNewSenseDef}
            newSenseCatId={newSenseCatId}
            setNewSenseCatId={setNewSenseCatId}
            addingSense={addingSense}
            onAddSense={handleAddSense}
            editingField={editingField}
            setEditingField={setEditingField}
            editingSenseCatId={editingSenseCatId}
            setEditingSenseCatId={setEditingSenseCatId}
            onSaveSenseTranslation={handleSaveSenseTranslation}
            onSaveSenseDefinition={handleSaveSenseDefinition}
            onChangeSenseCategory={handleSenseCategoryChange}
            onRemoveSense={handleRemoveSense}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}
