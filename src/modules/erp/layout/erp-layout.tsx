import { Outlet } from "react-router-dom";

import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";

export function ErpLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <ErpSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <ErpHeader />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}