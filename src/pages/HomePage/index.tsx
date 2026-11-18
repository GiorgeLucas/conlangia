import Button from "@/ui/Button";
import CreateProjectDialog from "@/ui/dialogs/CreateProjectDialog";
import OpenProjectDialog from "@/ui/dialogs/OpenProjectDialog";
import ProjectRow from "./components/ProjectRow";
import { FolderOpen, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";

export default function HomePage() {
  const { recentProjects, isLoading, error, refreshRecentProjects } = useProject();
  const [modal, setModal] = useState<"new" | "open" | null>(null);

  return (
    <main className="h-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-10 py-10">
        <section className="flex min-h-0 flex-1 items-center gap-16">
          <div className="w-[42%] shrink-0">
            <img src={"assets/logo.svg"} alt="Conlangia Logo" className="size-24 mb-8" />
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-violet-600">
              Shape a language
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-.035em]">
              Give every word
              <br />a place to belong.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-zinc-500 dark:text-zinc-400">
              Build your lexicon, organize meanings, and refine the sounds of
              your constructed language.
            </p>
            <div className="mt-8 flex gap-3">
              <Button onClick={() => setModal("new")} variant="primary">
                <Plus size={16} />
                New project
              </Button>
              <Button onClick={() => setModal("open")} variant="secondary">
                <FolderOpen size={16} />
                Open project
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col self-stretch py-20">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent projects</h3>
              <button
                type="button"
                onClick={refreshRecentProjects}
                disabled={isLoading}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 hover:cursor-pointer"
                aria-label="Refresh recent projects"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {isLoading && recentProjects.length === 0 ? (
                <div className="p-5 text-sm text-zinc-500">
                  Loading projects…
                </div>
              ) : error ? (
                <div className="p-4">
                  <p className="text-sm text-red-600">
                    Failed to load projects: {error}
                  </p>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No recent projects yet.
                </div>
              ) : (
                recentProjects.map((project) => (
                  <ProjectRow key={project.project_dir} project={project} />
                ))
              )}
            </div>
          </div>
        </section>
        <footer className="text-xs text-zinc-400">
          Your language files stay in the folder you choose.
        </footer>
      </div>
      <CreateProjectDialog
        open={modal === "new"}
        onOpenChange={(open) => setModal(open ? "new" : null)}
      />
      <OpenProjectDialog
        open={modal === "open"}
        onOpenChange={(open) => setModal(open ? "open" : null)}
      />
    </main>
  );
}
