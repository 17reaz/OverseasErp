// src/modules/erp/accounts/fixed-costs/fixed-costs-utils.ts

import type {
  FixedCost,
  FixedCostDueState,
  FixedCostFrequency,
  FixedCostStatus,
} from "./fixed-costs-types";

/* =========================================================
 * FORMATTERS
 * ========================================================= */

export function formatMoney(
  amount: number,
  currency = "BDT",
) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatFrequency(
  frequency: FixedCostFrequency,
) {
  switch (frequency) {
    case "monthly":
      return "Monthly";

    case "yearly":
      return "Yearly";

    case "one_time":
      return "One Time";

    default:
      return frequency;
  }
}

export function todayIso() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

/* =========================================================
 * DUE STATE
 * ========================================================= */

/**
 * Pending cost গুলোর due date কতটা কাছে সেটা বের করে।
 * paid / cancelled হলে কোনো due state নেই।
 */
export function getDueState(
  cost: FixedCost,
): FixedCostDueState {
  if (
    cost.status !== "pending" ||
    !cost.dueDate
  ) {
    return "none";
  }

  const due = new Date(
    `${cost.dueDate.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(due.getTime())) {
    return "none";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (due.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return "overdue";
  }

  if (diffDays <= 7) {
    return "due_soon";
  }

  return "upcoming";
}

export function getDueStateLabel(
  state: FixedCostDueState,
) {
  switch (state) {
    case "overdue":
      return "Overdue";

    case "due_soon":
      return "Due soon";

    default:
      return "";
  }
}

/* =========================================================
 * BADGE CLASSES
 * ========================================================= */

export function statusClass(
  status: FixedCostStatus,
) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";

    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export function dueStateClass(
  state: FixedCostDueState,
) {
  switch (state) {
    case "overdue":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

    case "due_soon":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

/* =========================================================
 * SUMMARY
 * ========================================================= */

export interface FixedCostSummary {
  monthlyEquivalent: number;

  pendingCount: number;
  pendingAmount: number;

  overdueCount: number;
  overdueAmount: number;

  paidThisMonthAmount: number;
  activeCount: number;
}

/**
 * Yearly খরচকে 12 দিয়ে ভাগ করে monthly run-rate বের করা হয়।
 * one_time আর cancelled গুলো run-rate এ ধরা হয় না।
 */
export function buildSummary(
  costs: FixedCost[],
): FixedCostSummary {
  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return costs.reduce<FixedCostSummary>(
    (result, cost) => {
      if (cost.status === "cancelled") {
        return result;
      }

      result.activeCount += 1;

      if (cost.frequency === "monthly") {
        result.monthlyEquivalent +=
          cost.amount;
      }

      if (cost.frequency === "yearly") {
        result.monthlyEquivalent +=
          cost.amount / 12;
      }

      if (cost.status === "pending") {
        result.pendingCount += 1;
        result.pendingAmount += cost.amount;

        if (
          getDueState(cost) === "overdue"
        ) {
          result.overdueCount += 1;
          result.overdueAmount +=
            cost.amount;
        }
      }

      if (
        cost.status === "paid" &&
        cost.paymentDate
      ) {
        const paidAt = new Date(
          `${cost.paymentDate.slice(
            0,
            10,
          )}T00:00:00`,
        );

        if (
          !Number.isNaN(paidAt.getTime()) &&
          paidAt.getMonth() ===
            currentMonth &&
          paidAt.getFullYear() ===
            currentYear
        ) {
          result.paidThisMonthAmount +=
            cost.amount;
        }
      }

      return result;
    },
    {
      monthlyEquivalent: 0,

      pendingCount: 0,
      pendingAmount: 0,

      overdueCount: 0,
      overdueAmount: 0,

      paidThisMonthAmount: 0,
      activeCount: 0,
    },
  );
}
