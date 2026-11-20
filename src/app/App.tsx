import "@/shared/styles/app.css";
import { ProjectProvider, useProject } from "@/features/projects/context/ProjectContext";
import { NavigationProvider } from "@/app/contexts/NavigationContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import HomePage from "@/features/projects/pages/HomePage";
import WorkspaceLayout from "@/app/layouts/WorkspaceLayout";

function AppContent() {
  const { currentProject } = useProject();

  if (!currentProject) {
    return <HomePage />;
  }

  return (
    <NavigationProvider>
      <WorkspaceLayout />
    </NavigationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <div className="app-root select-none">
          <AppContent />
        </div>
      </ProjectProvider>
    </ThemeProvider>
  );
}
