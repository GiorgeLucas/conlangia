import { Select } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

interface CustomSelectProps {
  value: string | null;
  onValueChange: (val: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  className = "",
  triggerClassName = "",
  disabled = false,
}: CustomSelectProps) {
  return (
    <Select.Root
      value={value ?? ""}
      onValueChange={(val) => {
        onValueChange(val === "" ? null : val);
      }}
      disabled={disabled}
    >
      <Select.Trigger
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs transition-colors hover:border-neutral-200 focus:border-accent-700 focus:ring-1 focus:ring-accent-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 ${triggerClassName} ${className}`}
      >
        <Select.Value
          placeholder={
            <span className="text-zinc-400 dark:text-zinc-500">{placeholder}</span>
          }
        />
        <Select.Icon className="text-zinc-400 transition-transform dark:text-zinc-500">
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} className="z-50 min-w-(--anchor-width)">
          <Select.Popup className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-2xl">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="group flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 outline-none transition-colors data-highlighted:bg-violet-50 data-highlighted:text-violet-900 dark:text-zinc-200 dark:data-highlighted:bg-violet-950/40 dark:data-highlighted:text-violet-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Select.ItemText className="truncate font-medium">
                    {opt.label}
                  </Select.ItemText>
                  {opt.badge && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 group-data-highlighted:bg-violet-100 group-data-highlighted:text-violet-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-data-highlighted:bg-violet-900/60 dark:group-data-highlighted:text-violet-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <Select.ItemIndicator className="ml-2 text-violet-600 dark:text-violet-400">
                  <Check size={13} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
