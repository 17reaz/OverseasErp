// src/modules/erp/finance/finance-service.ts

/* =========================================================
   FINANCE SERVICE
   ---------------------------------------------------------
   No Supabase table backs this module yet, so this service
   simulates a backend with an in-memory dataset. Every
   function returns a Promise (with a small artificial delay)
   so the calling components behave exactly as they would
   against a real API — swap the bodies for `supabase.from(...)`
   calls later without touching any component.
========================================================= */

import { generateId } from "./finance-utils";

import type {
  FinanceAccount,
  FinanceExpense,
  FinanceInvoice,
  FinancePayable,
  FinanceReceivable,
  FinanceSummary,
  FinanceTransaction,
} from "./finance-types";

/* =========================================================
   HELPERS
========================================================= */

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number): string {
  return isoDaysAgo(-days);
}

function monthLabel(monthsAgo: number): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toLocaleDateString(undefined, { month: "short" });
}

/* =========================================================
   SEED DATA — ACCOUNTS
========================================================= */

let accounts: FinanceAccount[] = [
  {
    id: "acc_1",
    name: "Dutch-Bangla Bank — Main",
    type: "bank",
    accountNumber: "1012 4487 2201",
    balance: 1842500,
    currency: "BDT",
    isActive: true,
  },
  {
    id: "acc_2",
    name: "Office Cash",
    type: "cash",
    accountNumber: null,
    balance: 96500,
    currency: "BDT",
    isActive: true,
  },
  {
    id: "acc_3",
    name: "bKash Merchant",
    type: "mobile_banking",
    accountNumber: "01711-223344",
    balance: 214300,
    currency: "BDT",
    isActive: true,
  },
  {
    id: "acc_4",
    name: "Islami Bank — Payroll",
    type: "bank",
    accountNumber: "2093 5561 7790",
    balance: 512800,
    currency: "BDT",
    isActive: true,
  },
];

/* =========================================================
   SEED DATA — TRANSACTIONS
========================================================= */

let transactions: FinanceTransaction[] = [
  { id: generateId("txn"), date: isoDaysAgo(1), type: "income", category: "Service Charge", accountId: "acc_1", description: "Service charge — Rahim Uddin", reference: "INV-1042", amount: 85000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(2), type: "expense", category: "Visa Fee", accountId: "acc_2", description: "Visa stamping fee batch #22", reference: null, amount: 42000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(3), type: "income", category: "Agent Commission", accountId: "acc_3", description: "Commission received — Agent Karim", reference: "REC-0091", amount: 30000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(4), type: "expense", category: "Office Rent", accountId: "acc_1", description: "Office rent — Gulshan branch", reference: null, amount: 120000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(5), type: "expense", category: "Salary", accountId: "acc_4", description: "Staff salary — September", reference: null, amount: 380000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(6), type: "income", category: "Medical Fee Collection", accountId: "acc_2", description: "Medical fee — batch collection", reference: null, amount: 56000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(7), type: "income", category: "Ticket Charge", accountId: "acc_1", description: "Ticket charge — Jamal Hossain", reference: "INV-1041", amount: 48000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(9), type: "expense", category: "Agency Commission", accountId: "acc_3", description: "Commission payout — Al-Faisal Agency", reference: null, amount: 65000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(10), type: "expense", category: "Utility Bill", accountId: "acc_2", description: "Electricity + internet bill", reference: null, amount: 18500, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(12), type: "income", category: "Visa Processing Fee", accountId: "acc_1", description: "Visa processing — batch #21", reference: null, amount: 92000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(14), type: "expense", category: "Government Fee", accountId: "acc_1", description: "BMET smart card fees", reference: null, amount: 27500, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(1), type: "expense", category: "Travel & Transport", accountId: "acc_2", description: "Airport pickup & transport", reference: null, amount: 9200, status: "pending" },
  { id: generateId("txn"), date: isoDaysAgo(35), type: "income", category: "Service Charge", accountId: "acc_1", description: "Service charge — batch (Aug)", reference: null, amount: 410000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(40), type: "expense", category: "Salary", accountId: "acc_4", description: "Staff salary — August", reference: null, amount: 370000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(48), type: "expense", category: "Office Rent", accountId: "acc_1", description: "Office rent — August", reference: null, amount: 120000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(55), type: "income", category: "Agent Commission", accountId: "acc_3", description: "Commission received (Aug)", reference: null, amount: 145000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(65), type: "income", category: "Service Charge", accountId: "acc_1", description: "Service charge — batch (Jul)", reference: null, amount: 365000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(72), type: "expense", category: "Salary", accountId: "acc_4", description: "Staff salary — July", reference: null, amount: 365000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(95), type: "income", category: "Service Charge", accountId: "acc_1", description: "Service charge — batch (Jun)", reference: null, amount: 298000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(102), type: "expense", category: "Miscellaneous", accountId: "acc_2", description: "Office supplies & misc.", reference: null, amount: 34500, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(125), type: "income", category: "Service Charge", accountId: "acc_1", description: "Service charge — batch (May)", reference: null, amount: 276000, status: "completed" },
  { id: generateId("txn"), date: isoDaysAgo(140), type: "expense", category: "Salary", accountId: "acc_4", description: "Staff salary — May", reference: null, amount: 350000, status: "completed" },
];

/* =========================================================
   SEED DATA — INVOICES
========================================================= */

let invoices: FinanceInvoice[] = [
  { id: generateId("inv"), invoiceNo: "INV-1042", billTo: "Rahim Uddin", agent: "Karim Enterprise", issueDate: isoDaysAgo(1), dueDate: isoDaysFromNow(9), amount: 85000, paidAmount: 85000, status: "paid", notes: null },
  { id: generateId("inv"), invoiceNo: "INV-1043", billTo: "Jamal Hossain", agent: "Al-Faisal Agency", issueDate: isoDaysAgo(2), dueDate: isoDaysFromNow(12), amount: 95000, paidAmount: 40000, status: "sent", notes: "Partial payment received via bKash." },
  { id: generateId("inv"), invoiceNo: "INV-1044", billTo: "Shirin Akter", agent: null, issueDate: isoDaysAgo(5), dueDate: isoDaysFromNow(5), amount: 72000, paidAmount: 0, status: "sent", notes: null },
  { id: generateId("inv"), invoiceNo: "INV-1045", billTo: "Nazrul Islam", agent: "Karim Enterprise", issueDate: isoDaysAgo(20), dueDate: isoDaysAgo(6), amount: 88000, paidAmount: 0, status: "overdue", notes: "Follow up with agent." },
  { id: generateId("inv"), invoiceNo: "INV-1046", billTo: "Mizanur Rahman", agent: null, issueDate: isoDaysAgo(3), dueDate: isoDaysFromNow(15), amount: 64000, paidAmount: 0, status: "draft", notes: null },
  { id: generateId("inv"), invoiceNo: "INV-1047", billTo: "Farida Yasmin", agent: "Sonar Bangla Overseas", issueDate: isoDaysAgo(30), dueDate: isoDaysAgo(15), amount: 91000, paidAmount: 91000, status: "paid", notes: null },
  { id: generateId("inv"), invoiceNo: "INV-1048", billTo: "Abdul Kader", agent: "Al-Faisal Agency", issueDate: isoDaysAgo(45), dueDate: isoDaysAgo(31), amount: 78000, paidAmount: 20000, status: "overdue", notes: null },
];

/* =========================================================
   SEED DATA — RECEIVABLES
========================================================= */

let receivables: FinanceReceivable[] = [
  { id: generateId("rcv"), from: "Al-Faisal Agency", source: "Agent Commission", dueDate: isoDaysFromNow(7), amount: 65000, receivedAmount: 0, status: "pending", notes: null },
  { id: generateId("rcv"), from: "Karim Enterprise", source: "Candidate Service Fee", dueDate: isoDaysFromNow(3), amount: 48000, receivedAmount: 20000, status: "partial", notes: null },
  { id: generateId("rcv"), from: "Nazrul Islam", source: "Candidate Service Fee", dueDate: isoDaysAgo(6), amount: 88000, receivedAmount: 0, status: "overdue", notes: "Second reminder sent." },
  { id: generateId("rcv"), from: "Sonar Bangla Overseas", source: "Agent Commission", dueDate: isoDaysFromNow(18), amount: 32000, receivedAmount: 0, status: "pending", notes: null },
  { id: generateId("rcv"), from: "Medical Centre Ltd.", source: "Medical Refund", dueDate: isoDaysAgo(2), amount: 15500, receivedAmount: 15500, status: "received", notes: null },
  { id: generateId("rcv"), from: "Abdul Kader", source: "Candidate Service Fee", dueDate: isoDaysAgo(31), amount: 58000, receivedAmount: 20000, status: "overdue", notes: null },
];

/* =========================================================
   SEED DATA — PAYABLES
========================================================= */

let payables: FinancePayable[] = [
  { id: generateId("pay"), vendor: "Landlord — Gulshan Office", category: "Office Rent", dueDate: isoDaysFromNow(5), amount: 120000, paidAmount: 0, status: "pending", notes: null },
  { id: generateId("pay"), vendor: "Al-Faisal Agency", category: "Agency Commission", dueDate: isoDaysFromNow(2), amount: 65000, paidAmount: 0, status: "pending", notes: null },
  { id: generateId("pay"), vendor: "DESCO", category: "Utility Bill", dueDate: isoDaysAgo(1), amount: 18500, paidAmount: 0, status: "overdue", notes: null },
  { id: generateId("pay"), vendor: "City Medical Centre", category: "Medical Fee", dueDate: isoDaysFromNow(10), amount: 42000, paidAmount: 15000, status: "partial", notes: null },
  { id: generateId("pay"), vendor: "BMET", category: "Government Fee", dueDate: isoDaysFromNow(20), amount: 27500, paidAmount: 27500, status: "paid", notes: null },
  { id: generateId("pay"), vendor: "Star Travels", category: "Ticket Purchase", dueDate: isoDaysFromNow(8), amount: 156000, paidAmount: 0, status: "pending", notes: null },
];

/* =========================================================
   SEED DATA — EXPENSES
========================================================= */

let expenses: FinanceExpense[] = [
  { id: generateId("exp"), date: isoDaysAgo(1), category: "Travel & Transport", vendor: "Local Transport", description: "Airport pickup & drop", amount: 9200, paymentMethod: "cash", status: "pending" },
  { id: generateId("exp"), date: isoDaysAgo(2), category: "Visa Fee", vendor: "Saudi Embassy", description: "Visa stamping — batch #22", amount: 42000, paymentMethod: "bank_transfer", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(4), category: "Office Rent", vendor: "Landlord — Gulshan Office", description: "September rent", amount: 120000, paymentMethod: "bank_transfer", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(5), category: "Salary", vendor: "Payroll", description: "Staff salary — September", amount: 380000, paymentMethod: "bank_transfer", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(9), category: "Agency Commission", vendor: "Al-Faisal Agency", description: "Commission payout", amount: 65000, paymentMethod: "mobile_banking", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(10), category: "Utility Bill", vendor: "DESCO / ISP", description: "Electricity + internet", amount: 18500, paymentMethod: "cash", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(14), category: "Government Fee", vendor: "BMET", description: "Smart card fees", amount: 27500, paymentMethod: "bank_transfer", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(16), category: "Office Supplies", vendor: "Nilkhet Stationery", description: "Printer paper, toner, folders", amount: 6200, paymentMethod: "cash", status: "paid" },
  { id: generateId("exp"), date: isoDaysAgo(20), category: "Medical Fee", vendor: "City Medical Centre", description: "Batch medical fee", amount: 27000, paymentMethod: "card", status: "pending" },
  { id: generateId("exp"), date: isoDaysAgo(25), category: "Ticket Purchase", vendor: "Star Travels", description: "Air ticket — 6 candidates", amount: 156000, paymentMethod: "bank_transfer", status: "pending" },
];

/* =========================================================
   ACCOUNTS — CRUD
========================================================= */

export async function getAccounts(): Promise<FinanceAccount[]> {
  return delay([...accounts]);
}

/* =========================================================
   TRANSACTIONS — CRUD
========================================================= */

export async function getTransactions(): Promise<FinanceTransaction[]> {
  return delay(
    [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  );
}

export async function createTransaction(
  input: Omit<FinanceTransaction, "id">,
): Promise<FinanceTransaction> {
  const record: FinanceTransaction = { ...input, id: generateId("txn") };
  transactions = [record, ...transactions];

  const account = accounts.find((a) => a.id === record.accountId);
  if (account) {
    account.balance += record.type === "income" ? record.amount : -record.amount;
  }

  return delay(record);
}

export async function updateTransaction(
  id: string,
  input: Omit<FinanceTransaction, "id">,
): Promise<FinanceTransaction> {
  const record: FinanceTransaction = { ...input, id };
  transactions = transactions.map((t) => (t.id === id ? record : t));
  return delay(record);
}

export async function deleteTransaction(id: string): Promise<void> {
  transactions = transactions.filter((t) => t.id !== id);
  return delay(undefined);
}

/* =========================================================
   INVOICES — CRUD
========================================================= */

export async function getInvoices(): Promise<FinanceInvoice[]> {
  return delay(
    [...invoices].sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
    ),
  );
}

function nextInvoiceNo(): string {
  const numbers = invoices
    .map((inv) => parseInt(inv.invoiceNo.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `INV-${next}`;
}

export async function createInvoice(
  input: Omit<FinanceInvoice, "id" | "invoiceNo">,
): Promise<FinanceInvoice> {
  const record: FinanceInvoice = {
    ...input,
    id: generateId("inv"),
    invoiceNo: nextInvoiceNo(),
  };
  invoices = [record, ...invoices];
  return delay(record);
}

export async function updateInvoice(
  id: string,
  input: Partial<Omit<FinanceInvoice, "id" | "invoiceNo">>,
): Promise<FinanceInvoice> {
  let updated: FinanceInvoice | undefined;
  invoices = invoices.map((inv) => {
    if (inv.id !== id) return inv;
    updated = { ...inv, ...input };
    return updated;
  });
  if (!updated) throw new Error("Invoice not found");
  return delay(updated);
}

export async function deleteInvoice(id: string): Promise<void> {
  invoices = invoices.filter((inv) => inv.id !== id);
  return delay(undefined);
}

/* =========================================================
   RECEIVABLES — CRUD
========================================================= */

export async function getReceivables(): Promise<FinanceReceivable[]> {
  return delay(
    [...receivables].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    ),
  );
}

export async function createReceivable(
  input: Omit<FinanceReceivable, "id">,
): Promise<FinanceReceivable> {
  const record: FinanceReceivable = { ...input, id: generateId("rcv") };
  receivables = [record, ...receivables];
  return delay(record);
}

export async function updateReceivable(
  id: string,
  input: Partial<Omit<FinanceReceivable, "id">>,
): Promise<FinanceReceivable> {
  let updated: FinanceReceivable | undefined;
  receivables = receivables.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...input };
    return updated;
  });
  if (!updated) throw new Error("Receivable not found");
  return delay(updated);
}

export async function deleteReceivable(id: string): Promise<void> {
  receivables = receivables.filter((r) => r.id !== id);
  return delay(undefined);
}

/* =========================================================
   PAYABLES — CRUD
========================================================= */

export async function getPayables(): Promise<FinancePayable[]> {
  return delay(
    [...payables].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    ),
  );
}

export async function createPayable(
  input: Omit<FinancePayable, "id">,
): Promise<FinancePayable> {
  const record: FinancePayable = { ...input, id: generateId("pay") };
  payables = [record, ...payables];
  return delay(record);
}

export async function updatePayable(
  id: string,
  input: Partial<Omit<FinancePayable, "id">>,
): Promise<FinancePayable> {
  let updated: FinancePayable | undefined;
  payables = payables.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...input };
    return updated;
  });
  if (!updated) throw new Error("Payable not found");
  return delay(updated);
}

export async function deletePayable(id: string): Promise<void> {
  payables = payables.filter((p) => p.id !== id);
  return delay(undefined);
}

/* =========================================================
   EXPENSES — CRUD
========================================================= */

export async function getExpenses(): Promise<FinanceExpense[]> {
  return delay(
    [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  );
}

export async function createExpense(
  input: Omit<FinanceExpense, "id">,
): Promise<FinanceExpense> {
  const record: FinanceExpense = { ...input, id: generateId("exp") };
  expenses = [record, ...expenses];
  return delay(record);
}

export async function updateExpense(
  id: string,
  input: Partial<Omit<FinanceExpense, "id">>,
): Promise<FinanceExpense> {
  let updated: FinanceExpense | undefined;
  expenses = expenses.map((e) => {
    if (e.id !== id) return e;
    updated = { ...e, ...input };
    return updated;
  });
  if (!updated) throw new Error("Expense not found");
  return delay(updated);
}

export async function deleteExpense(id: string): Promise<void> {
  expenses = expenses.filter((e) => e.id !== id);
  return delay(undefined);
}

/* =========================================================
   SUMMARY / KPI
========================================================= */

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const outstandingReceivables = receivables.reduce(
    (sum, r) => sum + Math.max(r.amount - r.receivedAmount, 0),
    0,
  );

  const outstandingPayables = payables.reduce(
    (sum, p) => sum + Math.max(p.amount - p.paidAmount, 0),
    0,
  );

  const monthly = Array.from({ length: 6 }).map((_, idx) => {
    const monthsAgo = 5 - idx;

    const reference = new Date();
    reference.setDate(1);
    reference.setMonth(reference.getMonth() - monthsAgo);
    const year = reference.getFullYear();
    const month = reference.getMonth();

    const inMonth = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    return {
      label: monthLabel(monthsAgo),
      income: inMonth
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      expense: inMonth
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return delay({
    totalBalance,
    totalIncome,
    totalExpense,
    netCashflow: totalIncome - totalExpense,
    outstandingReceivables,
    outstandingPayables,
    monthly,
  });
}
