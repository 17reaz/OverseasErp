import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

import type {
  DashboardData,
} from "../dashboard-service";


interface Props {
  alerts: DashboardData["documentAlerts"];
}


export function DashboardDocumentAlerts({
  alerts,
}: Props) {
  const criticalCount =
    alerts
      .filter(
        (item) =>
          item.level ===
          "critical",
      )
      .reduce(
        (total, item) =>
          total + item.count,
        0,
      );


  return (
    <Card className="gap-0 overflow-hidden py-0">

      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-start justify-between">

          <div>
            <div className="flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-muted-foreground" />

              <h2 className="font-semibold">
                Document Alerts
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Documents currently blocking processing.
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <ShieldAlert className="h-4 w-4 text-destructive" />

              <span className="text-lg font-semibold text-destructive">
                {criticalCount}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              critical
            </p>
          </div>

        </div>
      </CardHeader>


      <CardContent className="p-0">
        {alerts.map((item) => {
          const Icon =
            item.level ===
            "critical"
              ? ShieldAlert
              : item.level ===
                  "warning"
                ? AlertCircle
                : FileWarning;


          return (
            <button
              key={item.title}
              type="button"
              className="group flex w-full items-center gap-3 border-b px-5 py-4 text-left transition-colors hover:bg-muted/50 last:border-b-0"
            >

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon
                  className={
                    item.level ===
                    "critical"
                      ? "h-4 w-4 text-destructive"
                      : "h-4 w-4 text-muted-foreground"
                  }
                />
              </div>


              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {item.title}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>


              <div className="flex items-center gap-3">
                <span className="inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold">
                  {item.count}
                </span>

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>

            </button>
          );
        })}
      </CardContent>


      <div className="flex items-center justify-between border-t px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />

          <span>
            Document monitoring active
          </span>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View all
        </button>
      </div>

    </Card>
  );
}