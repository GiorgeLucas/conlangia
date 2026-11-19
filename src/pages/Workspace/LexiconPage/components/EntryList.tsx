import { useState, useMemo } from "react";
import { EntryListRowDto } from "@/api/entries";
import { Plus, Search, X, BookOpen } from "lucide-react";
import Button from "@/ui/Button";

interface EntryListProps {
  entries: EntryListRowDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenCreate: () => void;
  isLoading: boolean;
}

export default function EntryList({
  entries,
  selectedId,
  onSelect,
  onOpenCreate,
  isLoading,
}: EntryListProps) {
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const query = search.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.entryForm.toLowerCase().includes(query) ||
        (e.primaryPronunciation &&
          e.primaryPronunciation.toLowerCase().includes(query)) ||
        e.translations.some((t) => t.toLowerCase().includes(query))
    );
  }, [entries, search]);

  return (
    <aside className="flex w-[380px] lg:w-[420px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header with Search and Add button */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Lexicon
            </h2>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              {entries.length} {entries.length === 1 ? "word" : "words"}
            </span>
          </div>
          <Button
            onClick={onOpenCreate}
            variant="primary"
            className="!h-8 !px-3 !text-xs !gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add word</span>
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search word, phonetic or meaning…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/80 pl-9 pr-8 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:focus:border-violet-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            Loading lexicon…
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            {search ? (
              <p>No words found matching "{search}"</p>
            ) : (
              <div className="space-y-3">
                <BookOpen size={24} className="mx-auto text-zinc-300 dark:text-zinc-700" />
                <p>No words in this lexicon yet.</p>
                <Button
                  onClick={onOpenCreate}
                  variant="secondary"
                  className="mx-auto !h-8 !px-3 !text-xs"
                >
                  <Plus size={13} />
                  Add first word
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.id)}
                className={`flex w-full flex-col gap-1.5 px-5 py-3.5 text-left transition-all hover:cursor-pointer ${
                  isSelected
                    ? "bg-violet-50/80 border-l-[3.5px] border-l-violet-600 dark:bg-violet-950/25 dark:border-l-violet-400"
                    : "border-l-[3.5px] border-l-transparent hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={`font-serif text-[17px] tracking-wide ${
                      isSelected
                        ? "font-semibold text-violet-950 dark:text-violet-200"
                        : "font-medium text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {entry.entryForm}
                  </span>
                  {entry.primaryPronunciation && (
                    <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      /{entry.primaryPronunciation}/
                    </span>
                  )}
                </div>

                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.translations.length > 0 ? (
                    <span>{entry.translations.join("; ")}</span>
                  ) : (
                    <span className="italic text-zinc-400 dark:text-zinc-600">
                      No translations yet
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
