// src/modules/erp/finance/finance-types.ts

/* =========================================================
   FINANCE MODULE — TYPES

   NOTE:
   This module currently runs on in-memory dummy data
   (see finance-service.ts). No Supabase table backs it yet —
   these types describe the shape the UI expects so wiring a
   real backend later is a drop-in replacement.
========================================================= */

/* =========================================================
   ACCOUNTS
========================================================= */

export type AccountType = "bank" | "cash" | "mobile_banking";

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
}

/* =========================================================
   TRANSACTIONS
========================================================= */

export type TransactionType = "income" | "expense";

export type TransactionStatus = "completed" | "pending";

export interface FinanceTransaction {
  id: string;
  date: string; // ISO date
  type: TransactionType;
  category: string;
  accountId: string;
  description: string;
  reference: string | null;
  amount: number;
  status: TransactionStatus;
}

/* =========================================================
   INVOICES (money owed TO us by candidates / agents)
========================================================= */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface FinanceInvoice {
  id: string;
  invoiceNo: string;
  billTo: string;
  agent: string | null;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes: string | null;
}

/* =========================================================
   RECEIVABLES (outstanding amounts owed to us)
========================================================= */

export type ReceivableStatus = "pending" | "partial" | "received" | "overdue";

export interface FinanceReceivable {
  id: string;
  from: string;
  source: string;
  dueDate: string;
  amount: number;
  receivedAmount: number;
  status: ReceivableStatus;
  notes: string | null;
}

/* =========================================================
   PAYABLES (bills we owe)
========================================================= */

export type PayableStatus = "pending" | "partial" | "paid" | "overdue";

export interface FinancePayable {
  id: string;
  vendor: string;
  category: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: PayableStatus;
  notes: string | null;
}

/* =========================================================
   EXPENSES
========================================================= */

export type PaymentMethod = "cash" | "bank_transfer" | "mobile_banking" | "card";

export type ExpenseStatus = "paid" | "pending";

export interface FinanceExpense {
  id: string;
  date: string;
  category: string;
  vendor: string;
  description: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
}

/* =========================================================
   SUMMARY / KPI
========================================================= */

export interface FinanceMonthlyPoint {
  label: string;
  income: number;
  expense: number;
}

export interface FinanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  monthly: FinanceMonthlyPoint[];
}
