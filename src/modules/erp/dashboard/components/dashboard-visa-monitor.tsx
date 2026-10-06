import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

interface VisaItem {
  id: string;
  candidateName: string;
  sl: number;
  expiryDate: string;
}

interface VisaStatus {
  label: string;
  className: string;
  icon: typeof AlertTriangle;
}

const DUMMY_VISAS: VisaItem[] = [
  {
    id: "visa-1",
    candidateName: "Rahim Ahmed",
    sl: 1024,
    expiryDate: "2026-10-18",
  },
  {
    id: "visa-2",
    candidateName: "Karim Hasan",
    sl: 1018,
    expiryDate: "2026-10-30",
  },
  {
    id: "visa-3",
    candidateName: "Sakib Hasan",
    sl: 1012,
    expiryDate: "2026-11-26",
  },
  {
    id: "visa-4",
    candidateName: "Abdul Karim",
    sl: 1009,
    expiryDate: "2026-10-02",
  },
  {
    id: "visa-5",
    candidateName: "Nayeem Islam",
    sl: 998,
    expiryDate: "2026-12-04",
  },
];

function getDaysRemaining(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getVisaStatus(daysRemaining: number): VisaStatus {
  if (daysRemaining < 0) {
    return {
      label: "Expired",
      className: "bg-destructive/10 text-destructive",
      icon: XCircle,
    };
  }

  if (daysRemaining <= 7) {
    return {
      label: "Critical",
      className: "bg-destructive/10 text-destructive",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Expiring Soon",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  };
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    },
  );
}

function getRemainingLabel(daysRemaining: number) {
  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);

    return days === 1
      ? "Expired 1 day ago"
      : `Expired ${days} days ago`;
  }

  if (daysRemaining === 0) {
    return "Expires today";
  }

  if (daysRemaining === 1) {
    return "1 day left";
  }

  return `${daysRemaining} days left`;
}

export function DashboardVisaMonitor() {
  const warningVisas = DUMMY_VISAS.map((visa) => {
    const daysRemaining = getDaysRemaining(
      visa.expiryDate,
    );

    return {
      ...visa,
      daysRemaining,
      status: getVisaStatus(daysRemaining),
    };
  })
    .filter((visa) => visa.daysRemaining <= 30)
    .sort(
      (a, b) =>
        a.daysRemaining - b.daysRemaining,
    );

  const expiredCount = warningVisas.filter(
    (visa) => visa.daysRemaining < 0,
  ).length;

  const criticalCount = warningVisas.filter(
    (visa) =>
      visa.daysRemaining >= 0 &&
      visa.daysRemaining <= 7,
  ).length;

  const soonCount = warningVisas.filter(
    (visa) =>
      visa.daysRemaining > 7 &&
      visa.daysRemaining <= 30,
  ).length;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="px-3 py-2 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">
                Visa Warnings
              </h3>

              {warningVisas.length > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {warningVisas.length}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Expired & upcoming expiry
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {expiredCount > 0 && (
              <StatusBadge
                value={expiredCount}
                label="Expired"
                className="text-destructive"
              />
            )}

            {criticalCount > 0 && (
              <StatusBadge
                value={criticalCount}
                label="≤7d"
                className="text-destructive"
              />
            )}

            {soonCount > 0 && (
              <StatusBadge
                value={soonCount}
                label="≤30d"
                className="text-amber-600 dark:text-amber-400"
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Warnings */}
      <CardContent className="px-3 pb-2.5 pt-1">
        {warningVisas.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-xs text-muted-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              ✓
            </span>

            No visa expiry warnings
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {warningVisas.slice(0, 4).map((visa) => {
              const StatusIcon = visa.status.icon;

              return (
                <div
                  key={visa.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 transition-colors hover:bg-muted/40"
                >
                  {/* Status */}
                  <div
                    className={[
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      visa.status.className,
                    ].join(" ")}
                  >
                    <StatusIcon className="size-3" />
                  </div>

                  {/* Candidate */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium">
                        {visa.candidateName}
                      </span>

                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        #{visa.sl}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                      <CalendarDays className="size-2.5" />

                      <span>
                        Expires {formatDate(visa.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="shrink-0 text-right">
                    <div
                      className={[
                        "text-[10px] font-semibold",
                        visa.daysRemaining < 0
                          ? "text-destructive"
                          : visa.daysRemaining <= 7
                            ? "text-destructive"
                            : "text-amber-600 dark:text-amber-400",
                      ].join(" ")}
                    >
                      {getRemainingLabel(
                        visa.daysRemaining,
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[8px] text-muted-foreground">
                      <Clock3 className="size-2.5" />

                      {visa.status.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {warningVisas.length > 4 && (
          <button
            type="button"
            className="mt-1.5 w-full text-center text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            +{warningVisas.length - 4} more visa warnings
          </button>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusBadgeProps {
  value: number;
  label: string;
  className?: string;
}

function StatusBadge({
  value,
  label,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-[9px] font-medium",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-semibold">
        {value}
      </span>

      {label}
    </span>
  );
}