import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Plane,
  UserPlus,
} from "lucide-react";

import type { DashboardData } from "../dashboard-service";

type ActivityKey =
  | "candidates"
  | "medical"
  | "mofa"
  | "visa"
  | "flights"
  | "payments";

type ActivityPeriod = "today" | "week";

type ActivityData = DashboardData["activity"]["today"];

interface ActivityConfig {
  key: ActivityKey;
  label: string;
  icon: typeof UserPlus;
}

const ACTIVITY_CONFIG: ActivityConfig[] = [
  {
    key: "candidates",
    label: "Candidates",
    icon: UserPlus,
  },
  {
    key: "medical",
    label: "Medical",
    icon: CheckCircle2,
  },
  {
    key: "mofa",
    label: "MOFA",
    icon: FileCheck2,
  },
  {
    key: "visa",
    label: "Visa",
    icon: FileCheck2,
  },
  {
    key: "flights",
    label: "Flights",
    icon: Plane,
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
  },
];

interface DashboardActivityProps {
  activity: DashboardData["activity"];
}

export function DashboardActivity({ activity }: DashboardActivityProps) {
  const [period, setPeriod] = useState<ActivityPeriod>("today");

  const data: ActivityData =
    period === "today" ? activity.today : activity.week;

  return (
    <div className="flex flex-col gap-1.5">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-muted-foreground">
          {period === "today"
            ? "Today's operational activity"
            : "Activity from the last 7 days"}
        </p>

        <div className="flex shrink-0 rounded-md border bg-muted/30 p-0.5">
          {(["today", "week"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={[
                "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                period === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {key === "today" ? "Today" : "Week"}
            </button>
          ))}
        </div>
      </div>

      {/* ONE ROW */}
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {ACTIVITY_CONFIG.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              title={item.label}
              className="flex min-w-0 flex-col items-center rounded-md border px-1 py-1"
            >
              <span className="flex items-center gap-1 text-sm font-semibold leading-tight">
                <Icon className="size-3 shrink-0 text-muted-foreground" />
                {data[item.key]}
              </span>

              <span className="max-w-full truncate text-[9px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}