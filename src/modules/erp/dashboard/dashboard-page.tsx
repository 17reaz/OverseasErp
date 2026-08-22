import { PageHeader } from "../shared/page-header";
import { DashboardStats } from "./components/dashboard-stats";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardTable } from "./components/dashboard-table";
import { RecentCandidates } from "./components/RecentCandidates";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your overseas recruitment operations."
      />

      <DashboardStats />

      <DashboardCharts />
      <RecentCandidates />

      <DashboardTable />
    </div>
  );
}