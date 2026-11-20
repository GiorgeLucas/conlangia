import { ProjectDto } from "@/features/projects/api/projects";
import { useProject } from "@/features/projects/context/ProjectContext";
import { FolderOpen, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";
import EditProjectDialog from "@/features/projects/components/dialogs/EditProjectDialog";
import getErrorMessage from "@/shared/utils/getErrorMessage";

export default function ProjectRow({ project }: { project: ProjectDto }) {
  const { openProject, updateProject, removeRecentProject, isLoading } =
    useProject();
  const [openingThis, setOpeningThis] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

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

  const handleRemoveRecent = async () => {
    setActionError(null);
    try {
      await removeRecentProject(project.project_dir);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleSaveProject = async (
    editedProject: ProjectDto,
    name: string,
    description: string | null
  ) => {
    await updateProject(editedProject.project_dir, name, description);
  };

  return (
    <>
      <div className="group/row border-b border-zinc-100 transition-colors last:border-0 hover:bg-violet-50 focus-within:bg-violet-50 dark:border-zinc-800 dark:hover:bg-violet-500/10 dark:focus-within:bg-violet-500/10">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleOpenProject}
            disabled={isLoading}
            className="group/open flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
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
            <span className="text-xs text-zinc-400 opacity-0 transition group-hover/open:opacity-100 group-focus-visible/open:opacity-100">
              {openingThis ? "Opening…" : "Open"}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-1 pr-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              disabled={isLoading}
              aria-label={`Edit ${project.metadata?.name ?? "project"}`}
              title="Edit project"
              className="rounded-md p-1.5 text-zinc-400 opacity-0 transition hover:cursor-pointer hover:text-violet-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group-hover/row:opacity-100 group-focus-within/row:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-violet-300"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => void handleRemoveRecent()}
              disabled={isLoading}
              aria-label={`Remove ${project.metadata?.name ?? "project"} from recent projects`}
              title="Close project and remove from recent projects"
              className="rounded-md p-1.5 text-zinc-400 opacity-0 transition hover:cursor-pointer hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group-hover/row:opacity-100 group-focus-within/row:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-red-400"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {(openError || actionError) && (
          <p
            role="alert"
            className="px-5 pb-3 text-xs text-red-600 dark:text-red-400"
          >
            {openError || actionError}
          </p>
        )}
      </div>
      <EditProjectDialog
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveProject}
      />
    </>
  );
}
