import { useEffect, useState, type FormEvent } from "react";
import {
  addEntryPronunciation,
  EntryDto,
  removeEntryPronunciation,
  updateEntryPronunciationDescription,
  updateEntryPronunciationValue,
} from "@/features/lexicon/api/entries";

interface UsePronunciationActionsProps {
  entry: EntryDto;
  onEntryUpdated: (updated: EntryDto) => void;
  setEditingField: (field: string | null) => void;
}

export default function usePronunciationActions({
  entry,
  onEntryUpdated,
  setEditingField,
}: UsePronunciationActionsProps) {
  const [showAddPron, setShowAddPron] = useState(false);
  const [newPronValue, setNewPronValue] = useState("");
  const [newPronDesc, setNewPronDesc] = useState("");
  const [addingPron, setAddingPron] = useState(false);

  useEffect(() => {
    setShowAddPron(false);
  }, [entry.id, entry.entryForm]);

  const addPronunciation = async (event: FormEvent) => {
    event.preventDefault();
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
    } catch (error) {
      console.error("Failed to add pronunciation:", error);
    } finally {
      setAddingPron(false);
    }
  };

  const savePronunciationValue = async (pronunciationId: number, value: string) => {
    const pronunciation = entry.pronunciations.find(
      (item) => item.id === pronunciationId
    );
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === pronunciation?.value) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntryPronunciationValue(
        entry.id,
        pronunciationId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (error) {
      console.error("Failed to update pronunciation value:", error);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const savePronunciationDescription = async (
    pronunciationId: number,
    value: string
  ) => {
    const pronunciation = entry.pronunciations.find(
      (item) => item.id === pronunciationId
    );
    const trimmedValue = value.trim() || null;
    if (trimmedValue === (pronunciation?.description || null)) {
      setEditingField(null);
      return true;
    }
    try {
      const updated = await updateEntryPronunciationDescription(
        entry.id,
        pronunciationId,
        trimmedValue
      );
      onEntryUpdated(updated);
      return true;
    } catch (error) {
      console.error("Failed to update pronunciation description:", error);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const removePronunciation = async (
    pronunciationId: number
  ): Promise<boolean> => {
    try {
      const updated = await removeEntryPronunciation(entry.id, pronunciationId);
      onEntryUpdated(updated);
      return true;
    } catch (error) {
      console.error("Failed to remove pronunciation:", error);
      return false;
    }
  };

  return {
    showAddPron,
    setShowAddPron,
    newPronValue,
    setNewPronValue,
    newPronDesc,
    setNewPronDesc,
    addingPron,
    addPronunciation,
    savePronunciationValue,
    savePronunciationDescription,
    removePronunciation,
  };
}
