import { useEffect, useState } from "react";
import {
  deleteEntry,
  EntryDto,
  updateEntryForm,
  updateEntryMorphType,
} from "@/features/lexicon/api/entries";

interface UseEntryHeaderActionsProps {
  entry: EntryDto;
  onEntryUpdated: (updated: EntryDto) => void;
  onEntryDeleted: (id: number) => void;
}

export default function useEntryHeaderActions({
  entry,
  onEntryUpdated,
  onEntryDeleted,
}: UseEntryHeaderActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingMorph, setIsChangingMorph] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    setIsChangingMorph(false);
  }, [entry.id, entry.entryForm]);

  const saveWordForm = async (value: string): Promise<boolean> => {
    try {
      const updated = await updateEntryForm(entry.id, value);
      onEntryUpdated(updated);
      return true;
    } catch (error) {
      console.error("Failed to update word form:", error);
      return false;
    }
  };

  const changeMorphType = async (value: string | null) => {
    const id = value ? Number(value) : null;
    try {
      const updated = await updateEntryMorphType(entry.id, id);
      onEntryUpdated(updated);
      setIsChangingMorph(false);
    } catch (error) {
      console.error("Failed to update morph type:", error);
    }
  };

  const deleteCurrentEntry = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(entry.id);
      onEntryDeleted(entry.id);
    } catch (error) {
      console.error("Failed to delete entry:", error);
      setIsDeleting(false);
    }
  };

  return {
    confirmDelete,
    setConfirmDelete,
    isDeleting,
    isChangingMorph,
    setIsChangingMorph,
    saveWordForm,
    changeMorphType,
    deleteCurrentEntry,
  };
}
