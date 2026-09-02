import { useEffect, useState } from "react";
import {
  getDashboardData,
  type DashboardData,
} from "./dashboard-service";

import { DashboardStats } from "./components/dashboard-stats";
import { DashboardTable } from "./components/dashboard-table";
import { DashboardDocumentAlerts } from "./components/document-alerts";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
import { DashboardPipeline } from "./components/dashboard-pipeline";
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

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border bg-muted/40"
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />

          <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="space-y-6">
       
        <div className="rounded-lg border border-destructive/30 p-6">
          <p className="font-medium">
            Failed to load dashboard
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadDashboard();
            }}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     NO DATA
  ======================================================= */

  if (!data) {
    return (
      <div className="space-y-6">
       
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No dashboard data available.
        </div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          KPI STATS
      =================================================== */}

      <DashboardStats
        stats={data.stats}
      />
      <DashboardPipeline
        data={data.pipeline}
      />

      {/* ===================================================
          DOCUMENT ALERTS
      =================================================== */}

      <DashboardDocumentAlerts
        alerts={data.documentAlerts}
      />

      {/* ===================================================
          QUICK SHORTCUTS
      =================================================== */}

      <DashboardShortcuts />

      {/* ===================================================
          RECENT CANDIDATES
      =================================================== */}

      <DashboardTable
        candidates={data.recentCandidates}
      />
    </div>
  );
}