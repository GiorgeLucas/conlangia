import { useState, useMemo } from "react";
import { EntryListRowDto } from "@/api/entries";
import { MorphTypeDto } from "@/api/morphTypes";
import { Plus, Search, X, BookOpen, ArrowUpDown } from "lucide-react";
import Button from "@/ui/Button";

interface EntryTableProps {
  entries: EntryListRowDto[];
  morphTypes: MorphTypeDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenCreate: () => void;
  isLoading: boolean;
}

export default function EntryTable({
  entries,
  morphTypes,
  selectedId,
  onSelect,
  onOpenCreate,
  isLoading,
}: EntryTableProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Map of morphTypeId -> MorphTypeDto for quick lookup
  const morphTypeMap = useMemo(() => {
    const map = new Map<number, MorphTypeDto>();
    for (const mt of morphTypes) {
      map.set(mt.id, mt);
    }
    return map;
  }, [morphTypes]);

  // Filter and sort entries
  const processedEntries = useMemo(() => {
    let result = entries;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.entryForm.toLowerCase().includes(q) ||
          (e.primaryPronunciation &&
            e.primaryPronunciation.toLowerCase().includes(q)) ||
          e.translations.some((t) => t.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      const cmp = a.entryForm.localeCompare(b.entryForm);
      return sortAsc ? cmp : -cmp;
    });
  }, [entries, search, sortAsc]);

  return (
    <div className="flex flex-1 min-w-[380px] flex-col border-r border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Top action bar: Title, Count, Search and Add Word Button */}
      <div className="flex flex-col gap-3.5 border-b border-zinc-200/80 p-5 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Lexicon
            </h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <Button
            onClick={onOpenCreate}
            variant="primary"
            className="!h-9 !px-3.5 !text-xs !gap-1.5 shadow-xs font-medium"
          >
            <Plus size={15} />
            <span>Add word</span>
          </Button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries, phonetics or translations…"
            className="h-10 w-full rounded-xl border border-zinc-200/80 bg-zinc-50/70 pl-10 pr-9 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:focus:border-violet-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-xs border-b border-zinc-200/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:bg-zinc-900/90 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-5">
                <button
                  type="button"
                  onClick={() => setSortAsc((prev) => !prev)}
                  className="flex items-center gap-1.5 transition hover:text-zinc-700 dark:hover:text-zinc-200 hover:cursor-pointer"
                >
                  <span>Entry Form</span>
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-3 px-4">Pronunciation</th>
              <th className="py-3 px-4">Senses / Translations</th>
              <th className="py-3 px-5 text-right">Type</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {isLoading && entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-sm text-zinc-400">
                  Loading lexicon entries…
                </td>
              </tr>
            ) : processedEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                    <BookOpen size={30} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {search ? `No entries found matching "${search}"` : "No words recorded yet."}
                    </p>
                    {!search && (
                      <Button
                        onClick={onOpenCreate}
                        variant="secondary"
                        className="!h-8 !px-3 !text-xs !gap-1"
                      >
                        <Plus size={13} />
                        Add first word
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              processedEntries.map((entry) => {
                const isSelected = entry.id === selectedId;
                const morphType =
                  entry.morphTypeId != null ? morphTypeMap.get(entry.morphTypeId) : null;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => onSelect(entry.id)}
                    className={`group transition-all hover:cursor-pointer ${
                      isSelected
                        ? "bg-violet-50/90 text-violet-950 dark:bg-violet-950/30 dark:text-violet-100"
                        : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    {/* Word Form */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-serif text-[17px] tracking-wide ${
                            isSelected
                              ? "font-semibold text-violet-900 dark:text-violet-200"
                              : "font-medium text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {entry.entryForm}
                        </span>
                      </div>
                    </td>

                    {/* Pronunciation */}
                    <td className="py-3.5 px-4">
                      {entry.primaryPronunciation ? (
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-sans tracking-wide">
                          /{entry.primaryPronunciation}/
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>

                    {/* Senses / Translations */}
                    <td className="py-3.5 px-4 text-sm max-w-[240px]">
                      {entry.translations.length > 0 ? (
                        <span className="truncate block font-normal text-zinc-700 dark:text-zinc-300">
                          {entry.translations.join("; ")}
                        </span>
                      ) : (
                        <span className="text-xs italic text-zinc-400">No definitions</span>
                      )}
                    </td>

                    {/* Morph Type Badge */}
                    <td className="py-3.5 px-5 text-right">
                      {morphType ? (
                        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20">
                          {morphType.label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
