// src/modules/erp/finance/finance-constants.ts

import type {
  AccountType,
  ExpenseStatus,
  InvoiceStatus,
  PayableStatus,
  PaymentMethod,
  ReceivableStatus,
  TransactionStatus,
  TransactionType,
} from "./finance-types";

/* =========================================================
   CURRENCY
========================================================= */

export const DEFAULT_CURRENCY = "BDT";

/* =========================================================
   ACCOUNT TYPES
========================================================= */

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "mobile_banking", label: "Mobile Banking" },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Bank",
  cash: "Cash",
  mobile_banking: "Mobile Banking",
};

/* =========================================================
   TRANSACTIONS
========================================================= */

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export const TRANSACTION_STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
];

export const INCOME_CATEGORIES = [
  "Service Charge",
  "Visa Processing Fee",
  "Agent Commission",
  "Medical Fee Collection",
  "Ticket Charge",
  "Other Income",
];

export const EXPENSE_CATEGORIES = [
  "Office Rent",
  "Salary",
  "Utility Bill",
  "Agency Commission",
  "Medical Fee",
  "Visa Fee",
  "Ticket Purchase",
  "Government Fee",
  "Travel & Transport",
  "Office Supplies",
  "Miscellaneous",
];

export const TRANSACTION_CATEGORIES = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

/* =========================================================
   INVOICES
========================================================= */

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

/* =========================================================
   RECEIVABLES
========================================================= */

export const RECEIVABLE_STATUS_OPTIONS: { value: ReceivableStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Received" },
  { value: "received", label: "Received" },
  { value: "overdue", label: "Overdue" },
];

export const RECEIVABLE_SOURCES = [
  "Candidate Service Fee",
  "Agent Commission",
  "Visa Refund",
  "Medical Refund",
  "Other",
];

/* =========================================================
   PAYABLES
========================================================= */

export const PAYABLE_STATUS_OPTIONS: { value: PayableStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

/* =========================================================
   EXPENSES
========================================================= */

export const EXPENSE_STATUS_OPTIONS: { value: ExpenseStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "card", label: "Card" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mobile_banking: "Mobile Banking",
  card: "Card",
};
