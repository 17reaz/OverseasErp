import { supabase } from "@/lib/supabase/client";

export type AccountType = "bank" | "cash" | "mobile_banking";

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string | null;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  account_number: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapAccount(row: AccountRow): FinanceAccount {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    accountNumber: row.account_number,
    currency: row.currency,
    openingBalance: Number(row.opening_balance),
    currentBalance: Number(row.current_balance),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAccounts(): Promise<FinanceAccount[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("accounts")
    .select(
      `
        id,
        name,
        type,
        account_number,
        currency,
        opening_balance,
        current_balance,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapAccount(row as AccountRow));
}
async function createAccount(input: {
  name: string;
  type: AccountType;
  accountNumber?: string | null;
  currency?: string;
  openingBalance?: number;
}) {
  const { data, error } = await supabase
    .schema("finance")
    .from("accounts")
    .insert({
      name: input.name,
      type: input.type,
      account_number: input.accountNumber ?? null,
      currency: input.currency ?? "BDT",
      opening_balance: input.openingBalance ?? 0,
      current_balance: input.openingBalance ?? 0,
    })
    .select(
      `
        id,
        name,
        type,
        account_number,
        currency,
        opening_balance,
        current_balance,
        is_active,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAccount(data as AccountRow);
}
export { getAccounts,createAccount };
