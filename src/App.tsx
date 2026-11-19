import "@/App.css";
import { ProjectProvider, useProject } from "@/contexts/ProjectContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import HomePage from "@/pages/HomePage";
import WorkspaceLayout from "@/layouts/WorkspaceLayout";

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
