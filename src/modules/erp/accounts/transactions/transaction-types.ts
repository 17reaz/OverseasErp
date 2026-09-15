// src/modules/erp/accounting/transactions/transaction-types.ts

export type TransactionType = "income" | "expense";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type PartyType =
  | "candidate"
  | "agent"
  | "vendor";

export interface TransactionAccount {
  id: string;
  name: string;
  type: "bank" | "cash" | "mobile_banking";
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

export interface Transaction {
  id: string;
  tenantId: string;

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
}

export type UpdateTransactionInput =
  CreateTransactionInput;