// src/modules/erp/accounting/transactions/transaction-types.ts

export type TransactionType =
  | "income"
  | "expense";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type PartyType =
  | "candidate"
  | "agent"
  | "vendor";

export type TransactionGroupStatus =
  | "pending"
  | "completed"
  | "cancelled";


export interface TransactionAccount {
  id: string;
  name: string;

  type:
    | "bank"
    | "cash"
    | "mobile_banking";

  accountNumber: string | null;

  currency: string;

  isActive: boolean;
}


export interface TransactionCategory {
  id: string;
  name: string;

  type: TransactionType;

  parentId: string | null;

  isActive: boolean;
}


export interface TransactionParty {
  id: string;

  partyType: PartyType;

  partyId: string;

  name: string;

  phone: string | null;

  isActive: boolean;
}


/* =========================================================
 * TRANSACTION GROUP
 * ========================================================= */

export interface TransactionGroup {
  id: string;

  tenantId: string;

  groupDate: string;

  description: string | null;

  reference: string | null;

  status: TransactionGroupStatus;

  createdBy: string | null;

  createdAt: string;

  updatedAt: string;

  transactions: Transaction[];

  totalIncome: number;

  totalExpense: number;

  netAmount: number;
}


/* =========================================================
 * TRANSACTION
 * ========================================================= */

export interface Transaction {
  id: string;

  tenantId: string;

  groupId: string | null;

  accountId: string;

  categoryId: string | null;

  type: TransactionType;

  amount: number;

  date: string;

  description: string | null;

  reference: string | null;

  status: TransactionStatus;

  partyId: string | null;

  createdBy: string | null;

  createdAt: string;

  updatedAt: string;

  account?: TransactionAccount | null;

  category?: TransactionCategory | null;

  party?: TransactionParty | null;
}


/* =========================================================
 * CREATE TRANSACTION
 * ========================================================= */

export interface CreateTransactionInput {
  type: TransactionType;

  amount: number;

  date: string;

  accountId: string;

  categoryId: string | null;

  description: string | null;

  reference: string | null;

  status: TransactionStatus;

  partyId: string | null;

  groupId?: string | null;
}


export type UpdateTransactionInput =
  CreateTransactionInput;


/* =========================================================
 * CREATE GROUP
 * ========================================================= */

export interface CreateTransactionGroupInput {
  groupDate: string;

  description: string | null;

  reference: string | null;

  status: TransactionGroupStatus;

  transactions: CreateTransactionInput[];
}