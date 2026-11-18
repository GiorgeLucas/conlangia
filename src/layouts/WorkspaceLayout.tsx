import { useProject } from "@/contexts/ProjectContext";
import { NavPage, useNavigation } from "@/contexts/NavigationContext";
import {
  BookOpen,
  Boxes,
  Tags,
  Settings,
  ArrowLeft,
  Folder,
} from "lucide-react";

const NAV_ITEMS: { id: NavPage; label: string; icon: typeof BookOpen }[] = [
  { id: "lexicon", label: "Lexicon", icon: BookOpen },
  { id: "morphology", label: "Morphology", icon: Boxes },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function WorkspaceLayout() {
  const { currentProject, closeProject } = useProject();
  const { currentPage, setCurrentPage } = useNavigation();

  const projectName = currentProject?.metadata?.name || "Untitled Project";
  const projectDesc = currentProject?.metadata?.description || currentProject?.project_dir;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Project Header in Sidebar */}
        <div className="flex flex-col border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <button
              onClick={closeProject}
              className="group flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200 hover:cursor-pointer"
              title="Close project and return to home"
            >
              <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
              <span>All projects</span>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-600/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <Folder size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {projectName}
              </h2>
              <p className="truncate text-[11px] text-zinc-400" title={currentProject?.project_dir}>
                {projectDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:cursor-pointer ${
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={18} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-zinc-200 p-3 text-[11px] text-zinc-400 dark:border-zinc-800">
          <p className="truncate">Conlangia Workspace</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-8 dark:border-zinc-800">
          <h1 className="text-base font-semibold capitalize text-zinc-900 dark:text-zinc-100">
            {currentPage}
          </h1>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {currentPage === "lexicon" && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <BookOpen className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-medium">Lexicon View</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage your vocabulary, pronunciations, definitions, and senses.
              </p>
            </div>
          )}

          {currentPage === "morphology" && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <Boxes className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-medium">Morphology View</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Define morphological types like roots, affixes, clitics, and bound forms.
              </p>
            </div>
          )}

          {currentPage === "categories" && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <Tags className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-medium">Grammatical Categories</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Organize parts of speech such as Nouns, Verbs, Particles, and Adjectives.
              </p>
            </div>
          )}

          {currentPage === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
                <h3 className="text-sm font-semibold">Project Details</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-zinc-400">Name</dt>
                    <dd className="font-medium">{projectName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400">Description</dt>
                    <dd className="text-zinc-600 dark:text-zinc-400">
                      {currentProject?.metadata?.description || "No description provided."}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400">Directory</dt>
                    <dd className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {currentProject?.project_dir}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400">Created At</dt>
                    <dd className="text-xs text-zinc-500">
                      {currentProject?.metadata?.created_at
                        ? new Date(currentProject.metadata.created_at).toLocaleString()
                        : "Unknown"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
