import { AlertCircle, Trash2 } from "lucide-react";
import { EntryDto } from "@/features/lexicon/api/entries";
import { MorphTypeDto } from "@/features/morphology/api/morphTypes";
import CustomSelect, { SelectOption } from "@/shared/components/Select";
import Badge from "@/shared/components/Badge";

interface EntryDetailHeaderProps {
  entry: EntryDto;
  primaryPronunciation: string | null;
  activeMorphType: MorphTypeDto | null;
  morphOptions: SelectOption[];
  onSaveWordForm: (value: string) => Promise<boolean>;
  isChangingMorph: boolean;
  setIsChangingMorph: (changing: boolean) => void;
  onMorphTypeChange: (value: string | null) => void;
  confirmDelete: boolean;
  setConfirmDelete: (confirm: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export default function EntryDetailHeader({
  entry,
  primaryPronunciation,
  activeMorphType,
  morphOptions,
  onSaveWordForm,
  isChangingMorph,
  setIsChangingMorph,
  onMorphTypeChange,
  confirmDelete,
  setConfirmDelete,
  isDeleting,
  onDelete,
}: EntryDetailHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Lexical Entry
          </span>

          <input
            key={`${entry.id}-${entry.entryForm}`}
            type="text"
            defaultValue={entry.entryForm}
            aria-label="Lexical entry form"
            title="Edit lexical entry"
            onBlur={async (event) => {
              const input = event.currentTarget;
              const value = input.value.trim();
              if (!value || value === entry.entryForm) {
                input.value = entry.entryForm;
                return;
              }
              const saved = await onSaveWordForm(value);
              if (!saved) input.value = entry.entryForm;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.currentTarget.value = entry.entryForm;
                event.currentTarget.blur();
              }
            }}
            className="mt-1 block w-full bg-transparent font-serif text-3xl font-semibold tracking-tight text-zinc-950 outline-none focus:text-violet-700 dark:text-zinc-50 dark:focus:text-violet-300 select-text"
          />

          {primaryPronunciation && (
            <p className="text-base text-zinc-700 dark:text-zinc-300 font-sans tracking-wide">
              /{primaryPronunciation}/
            </p>
          )}

          <div className="pt-1.5">
            {isChangingMorph ? (
              <div className="w-52">
                <CustomSelect
                  value={entry.morphTypeId ? String(entry.morphTypeId) : ""}
                  onValueChange={onMorphTypeChange}
                  options={morphOptions}
                  placeholder="Select morph type..."
                  defaultOpen
                  triggerClassName="!h-8 !text-xs !rounded-full"
                />
              </div>
            ) : (
              <Badge
                variant="accent"
                size="sm"
                onClick={() => setIsChangingMorph(true)}
                title="Click to change morph type"
              >
                {activeMorphType ? activeMorphType.label : "Set morph type..."}
              </Badge>
            )}
          </div>
        </div>

        <div>
          {confirmDelete ? (
            <div className="entry-detail-confirm flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 pt-1">
              <AlertCircle size={13} />
              <span className="font-medium">Delete entry?</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="font-bold underline transition-transform active:scale-95 hover:text-red-700 px-0.5 hover:cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes"}
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-zinc-400 hover:text-zinc-600 px-0.5 hover:cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete lexical entry"
              className="flex items-center justify-center rounded-lg p-1.5 text-red-500 transition hover:bg-red-50/80 hover:text-red-600 active:scale-95 dark:text-red-400 dark:hover:bg-red-950/30 hover:cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <hr className="my-5 border-t border-zinc-200/80 dark:border-zinc-800" />
    </>
  );
}
