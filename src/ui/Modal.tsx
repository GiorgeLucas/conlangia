import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] data-open:animate-[fadeIn_.15s_ease-out]" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 select-none rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 outline-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable=true]]:select-text dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <Dialog.Title className="pr-8 text-lg font-semibold">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X size={18} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
