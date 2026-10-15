import { useState, type DragEvent } from "react";

export const GLOBAL_DOCUMENT_DROP_EVENT =
  "overseas-erp:global-document-drop";

function isFileDrag(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.types.includes("Files");
}

export function useGlobalFileDrop() {
  const [active, setActive] = useState(false);

  const dragProps = {
    onDragEnter(event: DragEvent<HTMLElement>) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setActive(true);
    },

    onDragOver(event: DragEvent<HTMLElement>) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setActive(true);
    },

    onDragLeave(event: DragEvent<HTMLElement>) {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      setActive(false);
    },

    onDrop(event: DragEvent<HTMLElement>) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setActive(false);

      const file = event.dataTransfer.files[0];
      if (!file) return;

      window.dispatchEvent(
        new CustomEvent<File>(GLOBAL_DOCUMENT_DROP_EVENT, { detail: file }),
      );
    },
  };

  return { active, dragProps };
}