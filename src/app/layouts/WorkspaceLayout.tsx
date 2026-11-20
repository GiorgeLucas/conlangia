import { useProject } from "@/features/projects/context/ProjectContext";
import { NavPage, useNavigation } from "@/app/contexts/NavigationContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import LexiconPage from "@/features/lexicon/pages/LexiconPage";
import MorphologyPage from "@/features/morphology/pages/MorphologyPage";
import CategoriesPage from "@/features/categories/pages/CategoriesPage";
import SettingsPage from "@/features/projects/pages/SettingsPage";
import {
  BookOpen,
  Boxes,
  Tags,
  Settings,
  ArrowLeft,
  Folder,
  Moon,
  Sun,
} from "lucide-react";

const NAV_ITEMS: { id: NavPage; label: string; icon: typeof BookOpen }[] = [
  { id: "lexicon", label: "Lexicon", icon: BookOpen },
  { id: "morphology", label: "Morphology", icon: Boxes },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function WorkspaceLayout() {
  const {
    currentProject,
    closeProject,
    updateProject,
    deleteCurrentProject,
  } = useProject();
  const { currentPage, setCurrentPage } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  const projectName = currentProject?.metadata?.name || "Untitled Project";
  const projectDesc = currentProject?.metadata?.description || currentProject?.project_dir;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
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

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <span>Theme</span>
            <span className="ml-auto font-medium text-zinc-700 dark:text-zinc-300">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {currentPage === "lexicon" && <LexiconPage />}
        {currentPage === "morphology" && <MorphologyPage />}
        {currentPage === "categories" && <CategoriesPage />}
        {currentPage === "settings" && (
          <SettingsPage
            project={currentProject}
            onUpdateProject={(name, description) =>
              currentProject
                ? updateProject(currentProject.project_dir, name, description)
                : Promise.resolve()
            }
            onDeleteProject={deleteCurrentProject}
          />
        )}
      </main>
    </div>
  );
}
