import { useState } from "react";
import type { DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";
import {
  EntryDto,
  moveEntryPronunciation,
  moveEntrySense,
} from "@/features/lexicon/api/entries";

interface UseEntryReorderingProps {
  entry: EntryDto;
  onEntryUpdated: (updated: EntryDto) => void;
}

export default function useEntryReordering({
  entry,
  onEntryUpdated,
}: UseEntryReorderingProps) {
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

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
        onEntryUpdated(await moveEntrySense(entry.id, senseId, newPosition));
      }
    } catch (error) {
      console.error("Failed to reorder entry details:", error);
      setReorderError("Could not save the new order. Please try again.");
    } finally {
      setIsReordering(false);
    }
  };

  return { isReordering, reorderError, setReorderError, handleDragEnd };
}
