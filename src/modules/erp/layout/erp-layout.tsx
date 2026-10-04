import {
  Outlet,
} from "react-router-dom";
import { useUIStore } from "@/store/ui-store";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import {
  ErpSidebar,
} from "./erp-sidebar";
import {
  ErpHeader,
} from "./erp-header";
import { PermissionGuard } from "./permission-guard";

export function ErpLayout() {
  const sidebarOpen = useUIStore(
    (state) => state.sidebarOpen,
  );

  const setSidebarOpen = useUIStore(
    (state) => state.setSidebarOpen,
  );

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >

      <ErpSidebar />

      <SidebarInset
        className="
          flex
          h-svh
          flex-col
          overflow-hidden
        "
      >

        <ErpHeader />

        <main
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
          "
        >
                    <div className="flex h-full min-h-0 flex-col px-6 pt-6 pb-3">
<PermissionGuard>
  <Outlet />
</PermissionGuard>          </div>
        </main>

      </SidebarInset>

    </SidebarProvider>
  );
}