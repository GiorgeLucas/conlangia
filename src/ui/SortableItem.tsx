import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/react/sortable";

interface SortableItemProps {
  id: string;
  group: string;
  index: number;
  disabled?: boolean;
  className: string;
  children: (handleRef: (element: Element | null) => void) => ReactNode;
}

export default function SortableItem({
  id,
  group,
  index,
  disabled = false,
  className,
  children,
}: SortableItemProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    group,
    index,
    disabled,
    type: group,
    accept: group,
  });

  return (
    <div
      ref={ref}
      className={`${className}${isDragging ? " opacity-60" : ""}`}
    >
      {children(handleRef)}
    </div>
  );
}
