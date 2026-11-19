import { ProjectDto } from "@/api/projects";
import {
  Clock3,
  Folder,
  Pencil,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import Button from "@/ui/Button";
import EditProjectDialog from "@/ui/dialogs/EditProjectDialog";
import DeleteProjectDialog from "@/ui/dialogs/DeleteProjectDialog";

export default function SettingsPage({
  project,
  onUpdateProject,
  onDeleteProject,
}: {
  project: ProjectDto | null;
  onUpdateProject: (name: string, description: string | null) => Promise<void>;
  onDeleteProject: () => Promise<void>;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const projectName = project?.metadata?.name || "Untitled Project";
  const projectDescription =
    project?.metadata?.description || "No description provided.";
  const createdAt = project?.metadata?.created_at
    ? new Date(project.metadata.created_at).toLocaleString()
    : "Unknown";

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
            <SettingsIcon size={17} />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Settings
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Project information
            </p>
          </div>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto p-5 md:p-8">
        <div className="max-w-3xl space-y-5">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <Folder size={19} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">
                    Current project
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {projectName}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {projectDescription}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditOpen(true)}
                className="!h-8 !px-2.5 !text-xs"
              >
                <Pencil size={13} />
                Edit
              </Button>
            </div>

            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800" />

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <Folder size={13} />
                  Project directory
                </dt>
                <dd
                  className="mt-2 break-all rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400"
                  title={project?.project_dir}
                >
                  {project?.project_dir || "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <Clock3 size={13} />
                  Created
                </dt>
                <dd className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
                  {createdAt}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200/80 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/10">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Delete this project
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Permanently remove the project folder and all of its contents.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              className="!h-8 shrink-0 !px-2.5 !text-xs"
            >
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </div>
      </section>
      <EditProjectDialog
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={async (_, name, description) =>
          onUpdateProject(name, description)
        }
      />
      <DeleteProjectDialog
        open={isDeleteOpen}
        projectName={projectName}
        onOpenChange={setIsDeleteOpen}
        onDelete={onDeleteProject}
      />
    </div>
  );
}
