import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

import type { DashboardData } from "../dashboard-service";

interface Props {
  alerts: DashboardData["documentAlerts"];
}

export function DashboardDocumentAlerts({ alerts }: Props) {
  const criticalCount = alerts
    .filter((item) => item.level === "critical")
    .reduce((total, item) => total + item.count, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <FileWarning className="size-3.5 text-muted-foreground" />

            <h2 className="text-sm font-semibold leading-none">
              Document Alerts
            </h2>
          </div>

          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            Documents currently blocking processing
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1">
          <ShieldAlert className="size-3.5 text-destructive" />

          <span className="text-sm font-semibold tabular-nums text-destructive">
            {criticalCount}
          </span>

          <span className="text-[10px] text-muted-foreground">critical</span>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        {alerts.map((item) => {
          const Icon =
            item.level === "critical"
              ? ShieldAlert
              : item.level === "warning"
                ? AlertCircle
                : FileWarning;

          return (
            <button
              key={item.title}
              type="button"
              className="group flex w-full items-center gap-2.5 border-b px-2.5 py-2 text-left transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon
                  className={
                    item.level === "critical"
                      ? "size-3.5 text-destructive"
                      : "size-3.5 text-muted-foreground"
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight">
                  {item.title}
                </p>

                <p className="truncate text-[11px] text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {item.count}
              </span>

              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 flex shrink-0 items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="size-3" />
          Document monitoring active
        </span>

        <button
          type="button"
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          View all
        </button>
      </div>
    </div>
  );
}