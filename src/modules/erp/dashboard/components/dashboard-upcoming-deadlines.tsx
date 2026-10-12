import { CalendarClock, ChevronRight, Plane } from "lucide-react";

import type { DashboardDeadline } from "../services/dashboard-deadlines-service";

interface Props {
  deadlines: DashboardDeadline[];
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusText(deadline: DashboardDeadline): string {
  if (deadline.status === "today") {
    return "Today";
  }

  if (deadline.status === "soon") {
    return `${deadline.daysUntil} ${deadline.daysUntil === 1 ? "day" : "days"}`;
  }

  return `${deadline.daysUntil} days`;
}

function getStatusClass(status: DashboardDeadline["status"]): string {
  switch (status) {
    case "overdue":
      return "border-destructive/30 bg-destructive/5 text-destructive";

    case "today":
      return "border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400";

    case "soon":
      return "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400";

    default:
      return "border-primary/20 bg-primary/5 text-primary";
  }
}

export function DashboardUpcomingDeadlines({ deadlines }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5 text-muted-foreground" />

            <h2 className="text-sm font-semibold leading-none">
              Upcoming Deadlines
            </h2>
          </div>

          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            Operational deadlines for the next 30 days
          </p>
        </div>

        {deadlines.length > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">
            {deadlines.length}
          </span>
        )}
      </div>

      {/* Body */}
      {deadlines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <CalendarClock className="mb-1.5 size-4 text-muted-foreground" />

          <p className="text-xs font-medium">No upcoming deadlines</p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Nothing scheduled in the next 30 days.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y overflow-auto rounded-md border">
          {deadlines.map((deadline) => (
            <li
              key={deadline.id}
              className="group flex items-center gap-2.5 px-2.5 py-2 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Plane className="size-3.5 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-medium leading-tight">
                    {deadline.candidateName}
                  </p>

                  <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
                    {deadline.passportNo}
                  </span>
                </div>

                <p className="truncate text-[11px] text-muted-foreground">
                  {deadline.title} · {formatDate(deadline.date)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
                  deadline.status,
                )}`}
              >
                {getStatusText(deadline)}
              </span>

              <ChevronRight className="hidden size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}