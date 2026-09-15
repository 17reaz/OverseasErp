// src/modules/erp/accounts/fixed-costs/components/fixed-costs-summary.tsx

import type { ReactNode } from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Repeat,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

import {
  formatMoney,
  type FixedCostSummary,
} from "../fixed-costs-utils";

interface FixedCostsSummaryProps {
  summary: FixedCostSummary;
  loading: boolean;
}

interface StatProps {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone?: "default" | "danger";
}

function Stat({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: StatProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${
              tone === "danger"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-muted"
            }`}
          >
            {icon}
          </div>

          <span className="text-xs text-muted-foreground">
            {hint}
          </span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {label}
        </p>

        <p
          className={`mt-1 text-xl font-semibold ${
            tone === "danger"
              ? "text-destructive"
              : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function FixedCostsSummary({
  summary,
  loading,
}: FixedCostsSummaryProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton
            key={item}
            className="h-[132px] w-full rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Stat
        label="Monthly Run Rate"
        value={formatMoney(
          summary.monthlyEquivalent,
        )}
        hint={`${summary.activeCount} active`}
        icon={<Repeat className="size-4" />}
      />

      <Stat
        label="Pending Amount"
        value={formatMoney(
          summary.pendingAmount,
        )}
        hint={`${summary.pendingCount} pending`}
        icon={
          <CalendarClock className="size-4" />
        }
      />

      <Stat
        label="Overdue Amount"
        value={formatMoney(
          summary.overdueAmount,
        )}
        hint={`${summary.overdueCount} overdue`}
        tone={
          summary.overdueCount > 0
            ? "danger"
            : "default"
        }
        icon={
          <AlertTriangle className="size-4" />
        }
      />

      <Stat
        label="Paid This Month"
        value={formatMoney(
          summary.paidThisMonthAmount,
        )}
        hint="Current month"
        icon={
          <CheckCircle2 className="size-4" />
        }
      />
    </div>
  );
}
