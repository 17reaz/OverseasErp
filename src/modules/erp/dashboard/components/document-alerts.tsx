import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

const documentAlerts = [
  {
    title: "Police Clearance Missing",
    description:
      "Medical completed but PC is not available. Visa processing is blocked.",
    count: 12,
    label: "Critical",
    type: "critical",
  },
  {
    title: "Passport Document Missing",
    description:
      "Passport document is required before continuing the application.",
    count: 5,
    label: "Critical",
    type: "critical",
  },
  {
    title: "Required Document Missing",
    description:
      "Documents are incomplete before visa processing.",
    count: 8,
    label: "Warning",
    type: "warning",
  },
  {
    title: "Document Verification Pending",
    description:
      "Uploaded documents are waiting for verification.",
    count: 14,
    label: "Attention",
    type: "attention",
  },
] as const;

const typeStyles = {
  critical: {
    icon: "text-destructive",
    badge:
      "border-destructive/20 bg-destructive/10 text-destructive",
  },

  warning: {
    icon: "text-amber-600 dark:text-amber-400",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },

  attention: {
    icon: "text-blue-600 dark:text-blue-400",
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
};

function DocumentAlerts() {
  const criticalCount = documentAlerts
    .filter((item) => item.type === "critical")
    .reduce((total, item) => total + item.count, 0);

  return (
    <div className="rounded-lg border bg-background">
      {/* Header */}
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-muted-foreground" />

            <h2 className="font-semibold">
              Document Alerts
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Missing documents blocking candidate processing
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

      {/* Alerts */}
      <div className="divide-y">
        {documentAlerts.map((item) => {
          const styles = typeStyles[item.type];

          const Icon =
            item.type === "critical"
              ? ShieldAlert
              : item.type === "warning"
                ? AlertCircle
                : FileWarning;

          return (
            <button
              key={item.title}
              type="button"
              className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
            >
              {/* Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                <Icon
                  className={`h-4 w-4 ${styles.icon}`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {item.title}
                  </p>

                  <span
                    className={`hidden rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex ${styles.badge}`}
                  >
                    {item.label}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              {/* Count */}
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

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />

          <span>
            Document monitoring active
          </span>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </button>
      </div>
    </div>
  );
}

export function DashboardDocumentAlerts() {
  return <DocumentAlerts />;
}