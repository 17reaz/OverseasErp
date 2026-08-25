import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Plane,
  Stethoscope,
} from "lucide-react";

const attentionItems = [
  {
    title: "Medical expiring soon",
    description: "Medical validity expires within 7 days",
    count: 12,
    icon: Stethoscope,
    level: "critical",
  },
  {
    title: "MOFA applications delayed",
    description: "Applications waiting longer than expected",
    count: 7,
    icon: FileCheck2,
    level: "warning",
  },
  {
    title: "Visa needs attention",
    description: "Visa applications require follow-up",
    count: 4,
    icon: AlertCircle,
    level: "warning",
  },
  {
    title: "Flight confirmation",
    description: "Flights are waiting for confirmation",
    count: 3,
    icon: Plane,
    level: "info",
  },
] as const;

const agingItems = [
  {
    label: "0–3 days",
    count: 84,
    percentage: 100,
  },
  {
    label: "4–7 days",
    count: 42,
    percentage: 50,
  },
  {
    label: "8–14 days",
    count: 27,
    percentage: 32,
  },
  {
    label: "15+ days",
    count: 12,
    percentage: 14,
  },
] as const;

const levelStyles = {
  critical: {
    icon: "text-destructive",
    badge: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-400",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-400",
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
};

function AttentionRequired() {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />

            <h2 className="font-semibold">
              Attention Required
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Items that need follow-up
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </button>
      </div>

      <div className="divide-y">
        {attentionItems.map((item) => {
          const Icon = item.icon;
          const styles = levelStyles[item.level];

          return (
            <button
              key={item.title}
              type="button"
              className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon
                  className={`h-4 w-4 ${styles.icon}`}
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
                <span
                  className={`inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold ${styles.badge}`}
                >
                  {item.count}
                </span>

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProcessingAging() {
  const total = agingItems.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />

            <h2 className="font-semibold">
              Processing Aging
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Candidates by processing age
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold">
            {total}
          </p>

          <p className="text-xs text-muted-foreground">
            active
          </p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {agingItems.map((item, index) => {
          const isOld = index >= 2;

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  )}

                  {index === 1 && (
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  )}

                  {index >= 2 && (
                    <Clock3
                      className={
                        isOld
                          ? "h-4 w-4 text-amber-600 dark:text-amber-400"
                          : "h-4 w-4 text-muted-foreground"
                      }
                    />
                  )}

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-semibold">
                  {item.count}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-5 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>View aging candidates</span>

          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DashboardOperations() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AttentionRequired />

      <ProcessingAging />
    </div>
  );
}