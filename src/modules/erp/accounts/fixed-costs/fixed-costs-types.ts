// src/modules/erp/accounts/fixed-costs/fixed-costs-types.ts

export type FixedCostFrequency =
  | "monthly"
  | "yearly"
  | "one_time";

export type FixedCostStatus =
  | "pending"
  | "paid"
  | "cancelled";

/** Derived (not stored) — used for due-date highlighting in the UI. */
export type FixedCostDueState =
  | "overdue"
  | "due_soon"
  | "upcoming"
  | "none";

export interface FixedCostAccount {
  id: string;
  name: string;
  type: "bank" | "cash" | "mobile_banking";
  accountNumber: string | null;
  currency: string;
  isActive: boolean;
}

export interface FixedCost {
  id: string;
  tenantId: string;

  name: string;
  category: string;

  amount: number;
  frequency: FixedCostFrequency;

  dueDate: string | null;

  status: FixedCostStatus;

  paymentDate: string | null;
  paymentMethod: string | null;

  accountId: string | null;
  vendor: string | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  account?: FixedCostAccount | null;
}

export interface CreateFixedCostInput {
  name: string;
  category: string;

  amount: number;
  frequency: FixedCostFrequency;

  dueDate: string | null;

  status: FixedCostStatus;

  paymentDate: string | null;
  paymentMethod: string | null;

  accountId: string | null;
  vendor: string | null;

  notes: string | null;
}

export type UpdateFixedCostInput =
  CreateFixedCostInput;

/* =========================================================
 * FILTERS
 * ========================================================= */

export type FixedCostStatusFilter =
  | "all"
  | FixedCostStatus;

export type FixedCostFrequencyFilter =
  | "all"
  | FixedCostFrequency;

/* =========================================================
 * CONSTANTS
 * ========================================================= */

export const FIXED_COST_CATEGORIES = [
  "Office Rent",
  "Utilities",
  "Internet & Phone",
  "Salary & Allowance",
  "Government Fee",
  "License & Renewal",
  "Software & Subscription",
  "Marketing",
  "Transport",
  "Maintenance",
  "Insurance",
  "Bank Charge",
  "Other",
] as const;

export const FIXED_COST_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "bKash",
  "Nagad",
  "Rocket",
  "Card",
] as const;

export const FIXED_COST_FREQUENCY_OPTIONS: {
  value: FixedCostFrequency;
  label: string;
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One Time" },
];

export const FIXED_COST_STATUS_OPTIONS: {
  value: FixedCostStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];
