import { useEffect, useMemo, useState } from "react";

interface SelectableItem {
  id: number;
}

export default function useTableSelection<T extends SelectableItem>(
  items: T[],
  visibleItems: T[]
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set()
  );
  const availableIds = useMemo(
    () => new Set(items.map(({ id }) => id)),
    [items]
  );
  const visibleIds = useMemo(
    () => visibleItems.map(({ id }) => id),
    [visibleItems]
  );

  useEffect(() => {
    setSelectedIds((current) => {
      const retained = new Set(
        [...current].filter((id) => availableIds.has(id))
      );
      return retained.size === current.size ? current : retained;
    });
  }, [availableIds]);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    setSelectedIds,
    visibleIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelected,
    toggleVisibleSelection,
    clearSelection,
  };
}
