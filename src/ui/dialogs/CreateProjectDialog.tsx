import { open as openDirectory } from "@tauri-apps/plugin-dialog";
import { Modal } from "@/ui/Modal";
import { Field } from "@base-ui/react";
import Input from "@/ui/Input";
import { useState } from "react";
import Button from "@/ui/Button";
import { useProject } from "@/contexts/ProjectContext";

export default function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { createProject } = useProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setPath("");
    setError("");
  };

  const closeDialog = () => {
    resetForm();
    onOpenChange(false);
  };

  async function handleCreateProject() {
    if (!path.trim() || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createProject(path, name, description.trim() ? description : undefined);
      closeDialog();
    } catch (err) {
      setError(String(err));
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
      title="Create a new project"
      description="Choose a name and a folder for your language."
    >
      <div className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="text-sm font-medium">
            Project Name
          </Field.Label>
          <Field.Control
            render={
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full"
                placeholder="e.g. Lúmari"
                required
              />
            }
          />
        </Field.Root>
        <Field.Root>
          <Field.Label
            render={
              <span className="flex w-full justify-between items-center text-sm font-medium">
                Description{" "}
                <span className="text-xs text-zinc-400">(Optional)</span>
              </span>
            }
          />
          <Field.Control
            render={
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full"
                placeholder="e.g. A constructed language for the Lúmari people"
              />
            }
          />
        </Field.Root>
        <Field.Root>
          <Field.Label className="text-sm font-medium">
            Project Folder
          </Field.Label>
          <div className="flex items-end gap-1">
            <Field.Control
              render={
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="mt-1.5 w-full"
                  placeholder="e.g. /home/user/projects/lumari"
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
            disabled={busy || !path.trim() || !name.trim()}
            onClick={handleCreateProject}
          >
            {busy ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
