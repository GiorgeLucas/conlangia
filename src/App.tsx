import "@/App.css";
import { ProjectProvider, useProject } from "@/contexts/ProjectContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
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
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
