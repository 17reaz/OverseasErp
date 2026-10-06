import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Plane,
  UserPlus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

type ActivityKey =
  | "candidates"
  | "medical"
  | "mofa"
  | "visa"
  | "flights"
  | "payments";

type ActivityPeriod = "today" | "week";

interface ActivityData {
  candidates: number;
  medical: number;
  mofa: number;
  visa: number;
  flights: number;
  payments: number;
}

interface ActivityConfig {
  key: ActivityKey;
  label: string;
  icon: typeof UserPlus;
}

const TODAY: ActivityData = {
  candidates: 12,
  medical: 8,
  mofa: 5,
  visa: 3,
  flights: 4,
  payments: 7,
};

const THIS_WEEK: ActivityData = {
  candidates: 47,
  medical: 32,
  mofa: 21,
  visa: 18,
  flights: 9,
  payments: 24,
};

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

export function DashboardActivity() {
  const [period, setPeriod] =
    useState<ActivityPeriod>("today");

  const data =
    period === "today"
      ? TODAY
      : THIS_WEEK;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-3 py-2 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">
                Activity
              </h3>

              <span className="flex size-5 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-3 text-muted-foreground" />
              </span>
            </div>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {period === "today"
                ? "Today's operational activity"
                : "Activity from the last 7 days"}
            </p>
          </div>

          <div className="flex shrink-0 rounded-md border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={[
                "rounded px-2 py-1 text-[9px] font-medium transition-colors",
                period === "today"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={[
                "rounded px-2 py-1 text-[9px] font-medium transition-colors",
                period === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Week
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-2.5 pt-1.5">
        <div className="grid grid-cols-3 divide-x rounded-md border">
          {ACTIVITY_CONFIG.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="flex min-w-0 flex-col items-center justify-center px-1.5 py-2"
              >
                <div className="mb-1 flex size-6 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-3 text-muted-foreground" />
                </div>

                <span className="text-base font-semibold leading-none">
                  {data[item.key]}
                </span>

                <span className="mt-1 truncate text-[9px] text-muted-foreground">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t pt-1.5">
          <span className="text-[9px] text-muted-foreground">
            {period === "today"
              ? "Today"
              : "This week"}
          </span>

          <span className="text-[9px] font-medium text-muted-foreground">
            Updated just now
          </span>
        </div>
      </CardContent>
    </Card>
  );
}