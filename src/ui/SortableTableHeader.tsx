import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortDirection = "asc" | "desc";

interface SortableTableHeaderProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}

export default function SortableTableHeader({
  label,
  active,
  direction,
  onClick,
  className = "",
}: SortableTableHeaderProps) {
  const Icon = active
    ? direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  const nextDirection = active && direction === "asc" ? "descending" : "ascending";

  return (
    <th
      aria-sort={
        active
          ? direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={className}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Sort by ${label} ${nextDirection}`}
        className="flex items-center gap-1.5 outline-none transition-colors hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 dark:hover:text-zinc-200 hover:cursor-pointer"
      >
        <span>{label}</span>
        <Icon size={12} aria-hidden="true" />
      </button>
    </th>
  );
}
