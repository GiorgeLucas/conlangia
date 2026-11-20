import { open as openDirectory } from "@tauri-apps/plugin-dialog";
import { Field } from "@base-ui/react";
import { Modal } from "@/shared/components/Modal";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import { useState } from "react";
import { useProject } from "@/features/projects/context/ProjectContext";

export default function OpenProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { openProject } = useProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [path, setPath] = useState("");

  const resetForm = () => {
    setPath("");
    setError("");
  };

  const closeDialog = () => {
    resetForm();
    onOpenChange(false);
  };

  async function handleOpenProject() {
    if (!path.trim()) return;
    setBusy(true);
    setError("");
    try {
      await openProject(path);
      closeDialog();
    } catch (err) {
      console.error("Failed to open project:", err);
      setError(
        "Could not open this project. Check that the selected folder exists and contains valid Conlangia project files."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
      title="Open a project folder"
      description="Select a Conlangia project folder on your disk."
    >
      <div className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="text-sm font-medium">
            Project Path
          </Field.Label>
          <div className="mt-1.5 flex gap-2">
            <Field.Control
              render={
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full"
                  placeholder="e.g. /home/user/projects/lumari"
                  required
                  disabled
                />
              }
            />
            <Button
              variant="secondary"
              onClick={async () => {
                const selected = await openDirectory({
                  directory: true,
                  multiple: false,
                });
                if (selected) {
                  setPath(selected);
                }
              }}
            >
              Choose...
            </Button>
          </div>
        </Field.Root>
        {error && (
          <div className="text-sm text-red-600">
            <p>{error}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy || !path.trim()}
            onClick={handleOpenProject}
          >
            {busy ? "Opening…" : "Open Project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
