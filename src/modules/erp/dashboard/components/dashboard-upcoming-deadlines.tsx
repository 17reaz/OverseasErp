import {
  CalendarClock,
  ChevronRight,
  Plane,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DashboardDeadline } from "../services/dashboard-deadlines-service";

interface Props {
  deadlines: DashboardDeadline[];
}

function formatDate(
  date: string,
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${date}T00:00:00`,
    ),
  );
}

function getStatusText(
  deadline: DashboardDeadline,
): string {
  if (
    deadline.status ===
    "today"
  ) {
    return "Today";
  }

  if (
    deadline.status ===
    "soon"
  ) {
    return `${deadline.daysUntil} ${
      deadline.daysUntil === 1
        ? "day"
        : "days"
    }`;
  }

  return `${deadline.daysUntil} days`;
}

function getStatusClass(
  status: DashboardDeadline["status"],
): string {
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

export function DashboardUpcomingDeadlines({
  deadlines,
}: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />

              <CardTitle className="text-base">
                Upcoming Deadlines
              </CardTitle>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Important operational deadlines for the next 30 days.
            </p>
          </div>

          {deadlines.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              {deadlines.length}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {deadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              No upcoming deadlines
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              There are no scheduled deadlines in the next 30 days.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {deadlines.map(
              (deadline) => (
                <div
                  key={deadline.id}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {
                          deadline.candidateName
                        }
                      </p>

                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {deadline.passportNo}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {deadline.title}
                      </span>

                      <span className="text-muted-foreground">
                        •
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          deadline.date,
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      deadline.status,
                    )}`}
                  >
                    {getStatusText(
                      deadline,
                    )}
                  </div>

                  <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
                </div>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}