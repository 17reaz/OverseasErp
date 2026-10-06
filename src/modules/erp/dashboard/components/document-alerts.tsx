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
      {/* HEADER */}
      <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <FileWarning className="size-4 text-muted-foreground" />

            <h2 className="text-sm font-semibold">Document Alerts</h2>
          </div>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Documents currently blocking processing.
          </p>
        </div>

        <div className="shrink-0 text-right leading-tight">
          <div className="flex items-center justify-end gap-1">
            <ShieldAlert className="size-4 text-destructive" />

            <span className="text-base font-semibold text-destructive">
              {criticalCount}
            </span>
          </div>

          <p className="text-[10px] text-muted-foreground">critical</p>
        </div>
      </div>

      {/* LIST */}
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
              className="group flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon
                  className={
                    item.level === "critical"
                      ? "size-4 text-destructive"
                      : "size-4 text-muted-foreground"
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex min-w-7 items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold">
                  {item.count}
                </span>

                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-2 flex shrink-0 items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          Document monitoring active
        </span>

        <button
          type="button"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all
        </button>
      </div>
    </div>
  );
}