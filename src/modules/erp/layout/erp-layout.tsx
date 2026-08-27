import { Outlet } from "react-router-dom";

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";

export function ErpLayout() {
  return (
   <SidebarProvider>
  <ErpSidebar />

  <SidebarInset className="flex h-svh flex-col overflow-hidden">
    <ErpHeader />

    <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  </SidebarInset>
</SidebarProvider>
  );
}
