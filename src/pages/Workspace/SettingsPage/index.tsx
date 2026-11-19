import { ProjectDto } from "@/api/projects";
import { Clock3, Folder, Info, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage({
  project,
}: {
  project: ProjectDto | null;
}) {
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
            <div className="flex items-start gap-3">
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

          <div className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/30">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-zinc-400"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              These details are read-only. Project metadata editing is not
              currently available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
