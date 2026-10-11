import { useEffect, useRef, useState, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";

interface Props {
  onFiles: (files: File[]) => void;
  children: ReactNode;
}

/**
 * Lets the user drop files anywhere in the browser window (like Google Drive).
 * Shows a full-screen overlay while a file is being dragged over the page.
 */
export function PageDropzone({ onFiles, children }: Props) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const handler = useRef(onFiles);

  useEffect(() => {
    handler.current = onFiles;
  });

  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); // required, otherwise the drop event never fires
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); // stops the browser from opening the file
      depth.current = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) handler.current(files);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <>
      {children}
      {active && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] bg-background/80 p-4 backdrop-blur-sm"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-primary/5">
            <UploadCloud className="h-12 w-12 text-primary" />
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">They are scanned automatically. JPG, PNG or PDF.</p>
          </div>
        </div>
      )}
    </>
  );
}
