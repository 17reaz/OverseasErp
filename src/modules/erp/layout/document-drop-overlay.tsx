import { Outlet } from "react-router-dom";
import { useUIStore } from "@/store/ui-store";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";
import { PermissionGuard } from "./permission-guard";
import { DocumentDropOverlay } from "./document-drop-overlay";
import { useGlobalFileDrop } from "./use-global-file-drop";

export function ErpLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const { active: dragActive, dragProps } = useGlobalFileDrop();

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <ErpSidebar />

      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <ErpHeader />

        <main
          className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          {...dragProps}
        >
          <div className="flex h-full min-h-0 flex-col px-6 pt-6 pb-3">
            <PermissionGuard>
              <Outlet />
            </PermissionGuard>
          </div>

          {dragActive && <DocumentDropOverlay />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}