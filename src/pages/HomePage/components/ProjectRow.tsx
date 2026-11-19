import { ProjectDto } from "@/api/projects";
import { useProject } from "@/contexts/ProjectContext";
import { FolderOpen, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ProjectRow({ project }: { project: ProjectDto }) {
  const { openProject, isLoading } = useProject();
  const [openingThis, setOpeningThis] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const handleOpenProject = async () => {
    if (isLoading || openingThis) return;
    setOpeningThis(true);
    setOpenError(null);
    try {
      await openProject(project.project_dir);
    } catch (err) {
      console.error("Failed to open project:", err);
      setOpenError(
        "Could not open this project. Check that its folder exists and contains valid Conlangia project files."
      );
    } finally {
      setOpeningThis(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleOpenProject}
        disabled={isLoading}
        className="group flex w-full items-center gap-4 border-b border-zinc-100 px-5 py-4 text-left transition last:border-0 hover:bg-violet-50 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:hover:bg-violet-500/10"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          {openingThis ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <FolderOpen size={17} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {project.metadata?.name ?? "Untitled project"}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {project.metadata?.description || project.project_dir}
          </p>
        </div>
        <span className="text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100">
          {openingThis ? "Opening…" : "Open"}
        </span>
      </button>
      {openError && (
        <p
          role="alert"
          className="border-b border-zinc-100 px-5 py-2 text-xs text-red-600 dark:border-zinc-800 dark:text-red-400"
        >
          {openError}
        </p>
      )}
    </div>
  );
}
