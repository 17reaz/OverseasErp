// src/modules/erp/finance/finance-utils.ts

import { DEFAULT_CURRENCY } from "./finance-constants";

import type {
  ExpenseStatus,
  InvoiceStatus,
  PayableStatus,
  ReceivableStatus,
  TransactionStatus,
} from "./finance-types";

/* =========================================================
   CURRENCY / NUMBER FORMATTING
========================================================= */

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0).toLocaleString()}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

/* =========================================================
   DATE FORMATTING
========================================================= */

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;

  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}

/* =========================================================
   STATUS -> BADGE VARIANT / CLASSNAME

   The shared shadcn <Badge /> only ships default / secondary /
   destructive / outline / ghost variants, so custom color
   classes are layered on top via `outline` for finer states
   (paid vs pending vs overdue etc.).
========================================================= */

export function invoiceStatusClass(status: InvoiceStatus): string {
  switch (status) {
    case "paid":
      return "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "sent":
      return "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400";
    case "overdue":
      return "border-transparent bg-destructive/15 text-destructive";
    case "cancelled":
      return "border-transparent bg-muted text-muted-foreground";
    case "draft":
    default:
      return "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
  }
}

export function receivableStatusClass(status: ReceivableStatus): string {
  switch (status) {
    case "received":
      return "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "partial":
      return "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400";
    case "overdue":
      return "border-transparent bg-destructive/15 text-destructive";
    case "pending":
    default:
      return "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
  }
}

export function payableStatusClass(status: PayableStatus): string {
  switch (status) {
    case "paid":
      return "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "partial":
      return "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400";
    case "overdue":
      return "border-transparent bg-destructive/15 text-destructive";
    case "pending":
    default:
      return "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
  }
}

export function expenseStatusClass(status: ExpenseStatus): string {
  return status === "paid"
    ? "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
}

export function transactionStatusClass(status: TransactionStatus): string {
  return status === "completed"
    ? "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
}

/* =========================================================
   ID GENERATION (dummy in-memory records)
========================================================= */

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/* =========================================================
   CSV EXPORT (client-side only, no backend needed)
========================================================= */

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);

  const escapeCell = (value: unknown) => {
    const cell = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(cell)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
