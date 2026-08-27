import { PageHeader } from "../shared/page-header";

import { DashboardStats } from "./components/dashboard-stats";
import { DashboardTable } from "./components/dashboard-table";
import { DashboardDocumentAlerts } from "./components/document-alerts";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
export function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <PageHeader
        title="Dashboard"
        description="Overview of your overseas recruitment operations."
      />


      {/* =====================================================
          KPI / SUMMARY
      ===================================================== */}

      <DashboardStats />


      {/* =====================================================
          OPERATIONS
      ===================================================== */}

      <DashboardOperations />


      {/* =====================================================
          ALERTS
      ===================================================== */}

      <DashboardDocumentAlerts />


      {/* =====================================================
          ANALYTICS
      ===================================================== */}

      <DashboardCharts />


      {/* =====================================================
          INSIGHTS
      ===================================================== */}

      <DashboardInsights />


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <DashboardShortcuts />


      {/* =====================================================
          RECENT CANDIDATES
      ===================================================== */}

      <DashboardTable />

    </div>
  );
}