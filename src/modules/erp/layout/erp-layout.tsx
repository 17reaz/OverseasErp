
import { useState, type DragEvent } from "react";
import { Outlet } from "react-router-dom";
import { Upload } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";
import { PermissionGuard } from "./permission-guard";

const GLOBAL_DOCUMENT_DROP_EVENT =
  "overseas-erp:global-document-drop";

export function ErpLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const [documentDragActive, setDocumentDragActive] = useState(false);

  function isFileDrag(event: DragEvent<HTMLElement>) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    setDocumentDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDocumentDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDocumentDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    setDocumentDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    window.dispatchEvent(
      new CustomEvent<File>(GLOBAL_DOCUMENT_DROP_EVENT, {
        detail: file,
      }),
    );
  }

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <ErpSidebar />

      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <ErpHeader />

        <main
          className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex h-full min-h-0 flex-col px-6 pt-6 pb-3">
            <PermissionGuard>
              <Outlet />
            </PermissionGuard>
          </div>

          {documentDragActive && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
              <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-background p-10 text-center shadow-xl">
                <Upload className="size-10 text-primary" />
                <p className="text-lg font-semibold">
                  Drop document to scan
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, JPG or PNG · Passport, Medical, MOFA or Visa
                </p>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
