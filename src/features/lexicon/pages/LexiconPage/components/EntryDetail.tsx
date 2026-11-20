import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import {
  EntryDto,
} from "@/features/lexicon/api/entries";
import { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import { CategoryDto } from "@/features/categories/api/categories";
import { SelectOption } from "@/shared/components/Select";
import EntryDetailHeader from "./EntryDetailHeader";
import PronunciationsSection from "./PronunciationsSection";
import SensesSection from "./SensesSection";
import useEntryHeaderActions from "../hooks/useEntryHeaderActions";
import useEntryReordering from "../hooks/useEntryReordering";
import usePronunciationActions from "../hooks/usePronunciationActions";
import useSenseActions from "../hooks/useSenseActions";

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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const headerSentinelRef = useRef<HTMLDivElement>(null);

  const headerActions = useEntryHeaderActions({
    entry,
    onEntryUpdated,
    onEntryDeleted,
  });
  const pronunciationActions = usePronunciationActions({
    entry,
    onEntryUpdated,
    setEditingField,
  });
  const senseActions = useSenseActions({
    entry,
    onEntryUpdated,
    setEditingField,
  });
  const reordering = useEntryReordering({ entry, onEntryUpdated });

  useEffect(() => {
    setEditingField(null);
    reordering.setReorderError(null);
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

  const morphOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "No morphology type" },
      ...morphTypes.map((morphType) => ({
        value: String(morphType.id),
        label: morphType.label,
        badge: morphType.code,
      })),
    ],
    [morphTypes]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "No category" },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories]
  );

  const activeMorphType = useMemo(
    () =>
      entry.morphTypeId == null
        ? null
        : morphTypes.find((morphType) => morphType.id === entry.morphTypeId) ??
          null,
    [entry.morphTypeId, morphTypes]
  );

  const primaryPronunciation =
    entry.pronunciations.length > 0 ? entry.pronunciations[0].value : null;

  return (
    <DragDropProvider onDragEnd={reordering.handleDragEnd}>
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
            onSaveWordForm={headerActions.saveWordForm}
            isChangingMorph={headerActions.isChangingMorph}
            setIsChangingMorph={headerActions.setIsChangingMorph}
            onMorphTypeChange={headerActions.changeMorphType}
            confirmDelete={headerActions.confirmDelete}
            setConfirmDelete={headerActions.setConfirmDelete}
            isDeleting={headerActions.isDeleting}
            onDelete={headerActions.deleteCurrentEntry}
          />
        </div>
        <div key={entry.id} className="entry-detail-content">
          {reordering.reorderError && (
            <p
              role="alert"
              className="mb-3 text-sm text-red-600 dark:text-red-400"
            >
              {reordering.reorderError}
            </p>
          )}
          <PronunciationsSection
            entryId={entry.id}
            pronunciations={entry.pronunciations}
            isReordering={reordering.isReordering}
            showAddPron={pronunciationActions.showAddPron}
            setShowAddPron={pronunciationActions.setShowAddPron}
            newPronValue={pronunciationActions.newPronValue}
            setNewPronValue={pronunciationActions.setNewPronValue}
            newPronDesc={pronunciationActions.newPronDesc}
            setNewPronDesc={pronunciationActions.setNewPronDesc}
            addingPron={pronunciationActions.addingPron}
            onAddPronunciation={pronunciationActions.addPronunciation}
            editingField={editingField}
            setEditingField={setEditingField}
            onSavePronValue={pronunciationActions.savePronunciationValue}
            onSavePronDescription={
              pronunciationActions.savePronunciationDescription
            }
            onRemovePronunciation={pronunciationActions.removePronunciation}
          />
          <SensesSection
            entryId={entry.id}
            senses={entry.senses}
            isReordering={reordering.isReordering}
            categories={categories}
            categoryOptions={categoryOptions}
            showAddSense={senseActions.showAddSense}
            setShowAddSense={senseActions.setShowAddSense}
            newSenseTrans={senseActions.newSenseTrans}
            setNewSenseTrans={senseActions.setNewSenseTrans}
            newSenseDef={senseActions.newSenseDef}
            setNewSenseDef={senseActions.setNewSenseDef}
            newSenseCatId={senseActions.newSenseCatId}
            setNewSenseCatId={senseActions.setNewSenseCatId}
            addingSense={senseActions.addingSense}
            onAddSense={senseActions.addSense}
            editingField={editingField}
            setEditingField={setEditingField}
            editingSenseCatId={senseActions.editingSenseCatId}
            setEditingSenseCatId={senseActions.setEditingSenseCatId}
            onSaveSenseTranslation={senseActions.saveSenseTranslation}
            onSaveSenseDefinition={senseActions.saveSenseDefinition}
            onChangeSenseCategory={senseActions.changeSenseCategory}
            onRemoveSense={senseActions.removeSense}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}
