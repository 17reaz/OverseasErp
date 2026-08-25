import { PageHeader } from "../shared/page-header";
import { DashboardStats } from "./components/dashboard-stats";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardTable } from "./components/dashboard-table";
import { RecentCandidates } from "./components/RecentCandidates";
import {DashboardInsights} from "./components/dashboard-insights";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
import { DashboardOperations } from "./components/dashboard-operations";
import { DashboardDocumentAlerts } from "./components/document-alerts";
import { ModuleBottlenecks } from "./components/module-bottlenecks";
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your overseas recruitment operations."
      />

      <DashboardStats />
      <ModuleBottlenecks />
      <DashboardOperations />
      <DashboardDocumentAlerts />
      <DashboardCharts />
      <DashboardInsights />
      <DashboardShortcuts  />
      <RecentCandidates />
      <DashboardTable />
    </div>
  );
}