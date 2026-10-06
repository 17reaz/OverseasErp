import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getDashboardVisaWarnings,
  type DashboardVisaWarning,
} from "../dashboard-visa-monitor-service";

interface VisaStatus {
  label: string;
  className: string;
  icon: typeof AlertTriangle;
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
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  };
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function getRemainingLabel(daysRemaining: number) {
  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);

    return days === 1 ? "Expired 1 day ago" : `Expired ${days} days ago`;
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
  const [visas, setVisas] = useState<DashboardVisaWarning[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadWarnings = useCallback(async () => {
    try {
      setError(null);

      const data = await getDashboardVisaWarnings();

      setVisas(data);
    } catch (err) {
      console.error("Failed to load dashboard visa warnings:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load visa warnings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarnings();
  }, [loadWarnings]);

  const expiredCount = visas.filter((visa) => visa.daysRemaining < 0).length;

  const criticalCount = visas.filter(
    (visa) => visa.daysRemaining >= 0 && visa.daysRemaining <= 7,
  ).length;

  const soonCount = visas.filter(
    (visa) => visa.daysRemaining > 7 && visa.daysRemaining <= 30,
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* HEADER */}
      <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Expired & upcoming expiry
          {visas.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              {visas.length}
            </span>
          )}
        </p>

        {!loading && !error && visas.length > 0 && (
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
        )}
      </div>

      {/* BODY */}
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Loading visa warnings...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-3 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />

            <span className="truncate">Unable to load visa warnings</span>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadWarnings();
              }}
              className="ml-auto shrink-0 font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : visas.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              ✓
            </span>

            No visa expiry warnings
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {visas.slice(0, 4).map((visa) => {
              const status = getVisaStatus(visa.daysRemaining);

              const StatusIcon = status.icon;

              return (
                <li
                  key={visa.id}
                  title={status.label}
                  className="flex items-center gap-2 px-1 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={[
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      status.className,
                    ].join(" ")}
                  >
                    <StatusIcon className="size-3" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight">
                      {visa.candidateName}
                      {visa.sl !== null && (
                        <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                          #{visa.sl}
                        </span>
                      )}
                    </p>

                    <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                      <CalendarDays className="size-2.5 shrink-0" />

                      <span className="shrink-0">
                        {formatDate(visa.expiryDate)}
                      </span>

                      {visa.visaNo !== "—" && (
                        <>
                          <span>·</span>

                          <span className="truncate">{visa.visaNo}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 text-[10px] font-semibold",
                      visa.daysRemaining <= 7
                        ? "text-destructive"
                        : "text-amber-600 dark:text-amber-400",
                    ].join(" ")}
                  >
                    {getRemainingLabel(visa.daysRemaining)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* FOOTER */}
      {!loading && !error && visas.length > 4 && (
        <button
          type="button"
          className="mt-1 w-full shrink-0 text-center text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          +{visas.length - 4} more visa warnings
        </button>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  value: number;
  label: string;
  className?: string;
}

function StatusBadge({ value, label, className }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-[9px] font-medium",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-semibold">{value}</span>

      {label}
    </span>
  );
}