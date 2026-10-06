import { useEffect, useState, type ReactNode } from "react";
import {
  getDashboardData,
  type DashboardData,
} from "./dashboard-service";
import { ActionCenter } from "@/modules/erp/action-center";
import { DashboardHoldStages } from "./components/dashboard-hold-stages";
import { DashboardStats } from "./components/dashboard-stats";
import { DashboardTable } from "./components/dashboard-table";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardDocumentAlerts } from "./components/document-alerts";
import { DashboardShortcuts } from "./components/dashboard-shortcuts";
import { DashboardPipeline } from "./components/dashboard-pipeline";
import { DashboardCountryPassports } from "./components/dashboard-country-passports";
import { DashboardUpcomingDeadlines } from "./components/dashboard-upcoming-deadlines";

/* =======================================================
   SMALL TAB PANEL (no extra dependency)
======================================================= */

type TabItem = {
  key: string;
  label: string;
  content: ReactNode;
};

function TabPanel({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex min-h-0 flex-col rounded-lg border bg-background">
      <div className="flex shrink-0 gap-1 border-b p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab.key === current.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {current.content}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const result = await getDashboardData();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  /* ======================= LOADING ======================= */

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg border bg-muted/40"
            />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
          <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
          <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
        </div>
      </div>
    );
  }

  /* ======================= ERROR ======================= */

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 p-6">
        <p className="font-medium">Failed to load dashboard</p>

        <p className="mt-1 text-sm text-muted-foreground">{error}</p>

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
    );
  }

  /* ======================= NO DATA ======================= */

  if (!data) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        No dashboard data available.
      </div>
    );
  }

  /* ======================= DASHBOARD ======================= */

  return (
    // lg e screen height lock: page scroll hobe na.
    // Header/padding onujayi 7rem ta adjust korte paro.
    <div className="flex flex-col gap-3 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      {/* KPI STATS */}
      <div className="shrink-0">
        <DashboardStats stats={data.stats} />
      </div>

      {/* MAIN 3 COLUMNS */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
        {/* Column 1 */}
        <TabPanel
          tabs={[
            {
              key: "charts",
              label: "Charts",
              content: (
                <DashboardCharts
                  pipeline={data.pipeline}
                  trend={data.trend}
                />
              ),
            },
            {
              key: "pipeline",
              label: "Pipeline",
              content: <DashboardPipeline data={data.pipeline} />,
            },
            {
              key: "hold",
              label: "Hold Stages",
              content: (
                <DashboardHoldStages
                  reasons={data.stats.holdReasons}
                  total={data.stats.holdCandidates}
                />
              ),
            },
          ]}
        />

        {/* Column 2 */}
        <TabPanel
          tabs={[
            {
              key: "candidates",
              label: "Recent Candidates",
              content: (
                <DashboardTable candidates={data.recentCandidates} />
              ),
            },
            {
              key: "passports",
              label: "Country Passports",
              content: (
                <DashboardCountryPassports data={data.countryPassports} />
              ),
            },
            {
              key: "deadlines",
              label: "Deadlines",
              content: (
                <DashboardUpcomingDeadlines
                  deadlines={data.upcomingDeadlines}
                />
              ),
            },
          ]}
        />

        {/* Column 3 */}
        <TabPanel
          tabs={[
            {
              key: "actions",
              label: "Action Center",
              content: <ActionCenter />,
            },
            {
              key: "alerts",
              label: "Document Alerts",
              content: (
                <DashboardDocumentAlerts alerts={data.documentAlerts} />
              ),
            },
            {
              key: "shortcuts",
              label: "Shortcuts",
              content: <DashboardShortcuts />,
            },
          ]}
        />
      </div>
    </div>
  );
}