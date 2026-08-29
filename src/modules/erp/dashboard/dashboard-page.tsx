import { useEffect, useState } from "react";

import { PageHeader } from "../shared/page-header";

import {
  getDashboardData,
  type DashboardData,
} from "./dashboard-service";

import { DashboardStats } from "./components/dashboard-stats";
import { DashboardTable } from "./components/dashboard-table";
import { DashboardDocumentAlerts } from "./components/document-alerts";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
import { DashboardMofaCard } from "./components/dashboard-mofa-card";
import { DashboardVisaCard } from "./components/dashboard-visa-card";
import { DashboardFlightCard } from "./components/dashboard-flight-card";
export function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getDashboardData();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your overseas recruitment operations."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border bg-muted/40"
              />
            ),
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <DashboardMofaCard
    total={data.stats.mofaTotal}
    pending={data.stats.mofaPending}
    approved={data.stats.mofaApproved}
  />

  <DashboardVisaCard
    total={data.stats.visaTotal}
    pending={data.stats.visaPending}
    issued={data.stats.visaIssued}
  />

  <DashboardFlightCard
    total={data.stats.flightTotal}
    scheduled={data.stats.flightScheduled}
    departed={data.stats.flightDeparted}
  />
</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your overseas recruitment operations."
        />

        <div className="rounded-lg border border-destructive/30 p-6">
          <p className="font-medium">
            Failed to load dashboard
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your overseas recruitment operations."
      />

      <DashboardStats
        stats={data.stats}
      />

      <DashboardDocumentAlerts
        alerts={data.documentAlerts}
      />

      <DashboardShortcuts />

      <DashboardTable
        candidates={data.recentCandidates}
      />
    </div>
  );
}