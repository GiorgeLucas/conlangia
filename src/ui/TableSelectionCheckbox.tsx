import { Checkbox } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

interface TableSelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  visible?: boolean;
}

export default function TableSelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled = false,
  visible = false,
}: TableSelectionCheckboxProps) {
  return (
    <Checkbox.Root
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
      aria-label={label}
      disabled={disabled}
      className={`grid size-4 cursor-pointer place-items-center rounded border border-zinc-300 bg-white text-white outline-none transition-opacity data-checked:border-violet-600 data-checked:bg-violet-600 data-indeterminate:border-violet-600 data-indeterminate:bg-violet-600 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 [@media(hover:none)]:opacity-100 ${
        visible
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      }`}
    >
      <Checkbox.Indicator>
        {indeterminate ? (
          <Minus size={12} strokeWidth={3} />
        ) : (
          <Check size={12} strokeWidth={3} />
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
