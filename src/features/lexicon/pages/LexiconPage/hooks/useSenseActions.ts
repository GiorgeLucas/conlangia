import { useEffect, useState, type FormEvent } from "react";
import {
  addEntrySense,
  EntryDto,
  removeEntrySense,
  updateEntrySenseCategory,
  updateEntrySenseDefinition,
  updateEntrySenseTranslation,
} from "@/features/lexicon/api/entries";

interface UseSenseActionsProps {
  entry: EntryDto;
  onEntryUpdated: (updated: EntryDto) => void;
  setEditingField: (field: string | null) => void;
}

export default function useSenseActions({
  entry,
  onEntryUpdated,
  setEditingField,
}: UseSenseActionsProps) {
  const [showAddSense, setShowAddSense] = useState(false);
  const [newSenseTrans, setNewSenseTrans] = useState("");
  const [newSenseDef, setNewSenseDef] = useState("");
  const [newSenseCatId, setNewSenseCatId] = useState<number | null>(null);
  const [addingSense, setAddingSense] = useState(false);
  const [editingSenseCatId, setEditingSenseCatId] = useState<number | null>(
    null
  );

  useEffect(() => {
    setShowAddSense(false);
    setEditingSenseCatId(null);
  }, [entry.id, entry.entryForm]);

  const addSense = async (event: FormEvent) => {
    event.preventDefault();
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
    } catch (error) {
      console.error("Failed to add sense:", error);
    } finally {
      setAddingSense(false);
    }
  };

  const saveSenseTranslation = async (senseId: number, value: string) => {
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
    } catch (error) {
      console.error("Failed to update translation:", error);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const saveSenseDefinition = async (senseId: number, value: string) => {
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
    } catch (error) {
      console.error("Failed to update definition:", error);
      return false;
    } finally {
      setEditingField(null);
    }
  };

  const changeSenseCategory = async (
    senseId: number,
    categoryIdValue: string | null
  ) => {
    const categoryId = categoryIdValue ? Number(categoryIdValue) : null;
    try {
      const updated = await updateEntrySenseCategory(
        entry.id,
        senseId,
        categoryId
      );
      onEntryUpdated(updated);
      setEditingSenseCatId(null);
    } catch (error) {
      console.error("Failed to update sense category:", error);
    }
  };

  const removeSense = async (senseId: number): Promise<boolean> => {
    try {
      const updated = await removeEntrySense(entry.id, senseId);
      onEntryUpdated(updated);
      return true;
    } catch (error) {
      console.error("Failed to remove sense:", error);
      return false;
    }
  };

  return {
    showAddSense,
    setShowAddSense,
    newSenseTrans,
    setNewSenseTrans,
    newSenseDef,
    setNewSenseDef,
    newSenseCatId,
    setNewSenseCatId,
    addingSense,
    editingSenseCatId,
    setEditingSenseCatId,
    addSense,
    saveSenseTranslation,
    saveSenseDefinition,
    changeSenseCategory,
    removeSense,
  };
}
