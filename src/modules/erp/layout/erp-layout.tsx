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

      <SidebarInset>
        <ErpHeader />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}