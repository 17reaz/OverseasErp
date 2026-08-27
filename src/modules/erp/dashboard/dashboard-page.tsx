import { PageHeader } from "../shared/page-header";
import { DashboardStats } from "./components/dashboard-stats";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardTable } from "./components/dashboard-table";
import { RecentCandidates } from "./components/RecentCandidates";
import {DashboardInsights} from "./components/dashboard-insights";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
import { DashboardOperations } from "./components/dashboard-operations";
import { DashboardDocumentAlerts } from "./components/document-alerts";
// import { ModuleBottlenecks } from "./components/module-bottlenecks";
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"import { useEffect, useState } from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  getDashboardData,
  type DashboardData,
} from "./dashboard-service";

import { DashboardStats } from "./components/dashboard-stats";
import { DashboardTrend } from "./components/dashboard-trend";
import { DashboardPipeline } from "./components/dashboard-pipeline";
import { DashboardAging } from "./components/dashboard-aging";
import { DashboardTable } from "./components/dashboard-table";
import { DashboardDocumentAlerts } from "./components/document-alerts";


export function DashboardPage() {
  const [
    data,
    setData,
  ] = useState<DashboardData | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


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
          : "Failed to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadDashboard();
  }, []);


  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground">
            Loading your workspace...
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border bg-muted/30"
              />
            ),
          )}
        </div>
      </div>
    );
  }


  if (error && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />

          <h2 className="font-semibold">
            Dashboard failed to load
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {error}
          </p>

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              void loadDashboard();
            }}
          >
            <RefreshCw />
            Try again
          </Button>
        </div>
      </div>
    );
  }


  if (!data) {
    return null;
  }


  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground">
            Overview of your recruitment and overseas processing workflow.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void loadDashboard();
          }}
          disabled={loading}
        >
          <RefreshCw
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </Button>
      </div>


      {/* STATS */}

      <DashboardStats
        stats={data.stats}
      />


      {/* TREND + PIPELINE */}

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">

        <DashboardTrend
          data={data.trend}
        />

        <DashboardPipeline
          data={data.pipeline}
        />

      </div>


      {/* AGING + DOCUMENT ALERTS */}

      <div className="grid gap-6 xl:grid-cols-2">

        <DashboardAging
          data={data.aging}
        />

        <DashboardDocumentAlerts
          alerts={data.documentAlerts}
        />

      </div>


      {/* RECENT CANDIDATES */}

      <DashboardTable
        candidates={
          data.recentCandidates
        }
      />

    </div>
  );
}
        description="Overview of your overseas recruitment operations."
      />

      <DashboardStats />
      {/* <ModuleBottlenecks /> */}
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