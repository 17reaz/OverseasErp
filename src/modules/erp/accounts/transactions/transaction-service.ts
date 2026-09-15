// src/modules/erp/accounting/transactions/transaction-service.ts

import { supabase } from "@/lib/supabase/client";

import type {
  CreateTransactionInput,
  Transaction,
  TransactionAccount,
  TransactionCategory,
  TransactionParty,
  UpdateTransactionInput,
} from "./transaction-types";

/* =========================================================
 * HELPERS
 * ========================================================= */

async function getCurrentUserContext() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.tenant_id) {
    throw new Error("Your account is not linked to a tenant.");
  }

  return {
    userId: user.id,
    tenantId: profile.tenant_id as string,
  };
}

/* =========================================================
 * ACCOUNTS
 * ========================================================= */

export async function getTransactionAccounts(): Promise<
  TransactionAccount[]
> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      `
        id,
        name,
        type,
        account_number,
        currency,
        is_active
      `,
    )
    .schema("finance")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as TransactionAccount["type"],
    accountNumber: row.account_number,
    currency: row.currency,
    isActive: row.is_active,
  }));
}

/* =========================================================
 * CATEGORIES
 * ========================================================= */

export async function getTransactionCategories(): Promise<
  TransactionCategory[]
> {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
        id,
        name,
        type,
        parent_id,
        is_active
      `,
    )
    .schema("finance")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as TransactionCategory["type"],
    parentId: row.parent_id,
    isActive: row.is_active,
  }));
}

/* =========================================================
 * PARTIES
 * ========================================================= */

export async function getTransactionParties(): Promise<
  TransactionParty[]
> {
  const { data, error } = await supabase
    .from("parties")
    .select(
      `
        id,
        party_type,
        party_id,
        name,
        phone,
        is_active
      `,
    )
    .schema("finance")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    partyType: row.party_type as TransactionParty["partyType"],
    partyId: row.party_id,
    name: row.name,
    phone: row.phone,
    isActive: row.is_active,
  }));
}

/* =========================================================
 * GET TRANSACTIONS
 * ========================================================= */

export async function getTransactions(): Promise<
  Transaction[]
> {
  const [
    accounts,
    categories,
    parties,
  ] = await Promise.all([
    getTransactionAccounts(),
    getTransactionCategories(),
    getTransactionParties(),
  ]);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
        id,
        tenant_id,
        account_id,
        category_id,
        type,
        amount,
        transaction_date,
        description,
        reference,
        status,
        party_id,
        created_by,
        created_at,
        updated_at
      `,
    )
    .schema("finance")
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const accountMap = new Map(
    accounts.map((account) => [
      account.id,
      account,
    ]),
  );

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category,
    ]),
  );

  const partyMap = new Map(
    parties.map((party) => [
      party.id,
      party,
    ]),
  );

  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,

    accountId: row.account_id,
    categoryId: row.category_id,

    type: row.type as Transaction["type"],
    amount: Number(row.amount),
    date: row.transaction_date,

    description: row.description,
    reference: row.reference,

    status: row.status as Transaction["status"],

    partyId: row.party_id,

    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    account:
      accountMap.get(row.account_id) ?? null,

    category:
      row.category_id
        ? categoryMap.get(row.category_id) ?? null
        : null,

    party:
      row.party_id
        ? partyMap.get(row.party_id) ?? null
        : null,
  }));
}

/* =========================================================
 * GET SINGLE TRANSACTION
 * ========================================================= */

export async function getTransaction(
  id: string,
): Promise<Transaction> {
  const transactions =
    await getTransactions();

  const transaction = transactions.find(
    (item) => item.id === id,
  );

  if (!transaction) {
    throw new Error("Transaction not found.");
  }

  return transaction;
}

/* =========================================================
 * CREATE
 * ========================================================= */

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const {
    userId,
    tenantId,
  } = await getCurrentUserContext();

  if (!input.accountId) {
    throw new Error("Account is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error(
      "Transaction amount must be greater than zero.",
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      tenant_id: tenantId,

      account_id: input.accountId,
      category_id: input.categoryId,

      type: input.type,
      amount: input.amount,

      transaction_date: input.date,

      description: input.description,
      reference: input.reference,

      status: input.status,

      party_id: input.partyId,

      created_by: userId,
    })
    .schema("finance")
    .select(
      `
        id,
        tenant_id,
        account_id,
        category_id,
        type,
        amount,
        transaction_date,
        description,
        reference,
        status,
        party_id,
        created_by,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const accounts =
    await getTransactionAccounts();

  const categories =
    await getTransactionCategories();

  const parties =
    await getTransactionParties();

  return normalizeTransaction(
    data,
    accounts,
    categories,
    parties,
  );
}

/* =========================================================
 * UPDATE
 * ========================================================= */

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  if (!input.accountId) {
    throw new Error("Account is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error(
      "Transaction amount must be greater than zero.",
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      account_id: input.accountId,
      category_id: input.categoryId,

      type: input.type,
      amount: input.amount,

      transaction_date: input.date,

      description: input.description,
      reference: input.reference,

      status: input.status,

      party_id: input.partyId,

      updated_at: new Date().toISOString(),
    })
    .schema("finance")
    .eq("id", id)
    .select(
      `
        id,
        tenant_id,
        account_id,
        category_id,
        type,
        amount,
        transaction_date,
        description,
        reference,
        status,
        party_id,
        created_by,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const accounts =
    await getTransactionAccounts();

  const categories =
    await getTransactionCategories();

  const parties =
    await getTransactionParties();

  return normalizeTransaction(
    data,
    accounts,
    categories,
    parties,
  );
}

/* =========================================================
 * DELETE
 * ========================================================= */

export async function deleteTransaction(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .schema("finance");

  if (error) {
    throw new Error(error.message);
  }
}

/* =========================================================
 * NORMALIZER
 * ========================================================= */

function normalizeTransaction(
  row: {
    id: string;
    tenant_id: string;
    account_id: string;
    category_id: string | null;
    type: string;
    amount: number | string;
    transaction_date: string;
    description: string | null;
    reference: string | null;
    status: string;
    party_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  },
  accounts: TransactionAccount[],
  categories: TransactionCategory[],
  parties: TransactionParty[],
): Transaction {
  return {
    id: row.id,
    tenantId: row.tenant_id,

    accountId: row.account_id,
    categoryId: row.category_id,

    type: row.type as Transaction["type"],
    amount: Number(row.amount),

    date: row.transaction_date,

    description: row.description,
    reference: row.reference,

    status:
      row.status as Transaction["status"],

    partyId: row.party_id,

    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    account:
      accounts.find(
        (item) => item.id === row.account_id,
      ) ?? null,

    category:
      categories.find(
        (item) => item.id === row.category_id,
      ) ?? null,

    party:
      parties.find(
        (item) => item.id === row.party_id,
      ) ?? null,
  };
}