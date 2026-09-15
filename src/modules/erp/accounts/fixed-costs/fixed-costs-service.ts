// src/modules/erp/accounts/fixed-costs/fixed-costs-service.ts

import { supabase } from "@/lib/supabase/client";

import type {
  CreateFixedCostInput,
  FixedCost,
  FixedCostAccount,
  FixedCostFrequency,
  FixedCostStatus,
  UpdateFixedCostInput,
} from "./fixed-costs-types";

/* =========================================================
 * ROW SHAPE
 * ========================================================= */

interface FixedCostRow {
  id: string;
  tenant_id: string;

  name: string;
  category: string;

  amount: number | string;
  frequency: string;

  due_date: string | null;

  status: string;

  payment_date: string | null;
  payment_method: string | null;

  account_id: string | null;
  vendor: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

const FIXED_COST_SELECT = `
  id,
  tenant_id,
  name,
  category,
  amount,
  frequency,
  due_date,
  status,
  payment_date,
  payment_method,
  account_id,
  vendor,
  notes,
  created_at,
  updated_at
`;

/* =========================================================
 * HELPERS
 * ========================================================= */

async function getCurrentTenantId(): Promise<string> {
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
    throw new Error(
      "Your account is not linked to a tenant.",
    );
  }

  return profile.tenant_id as string;
}

function normalizeFixedCost(
  row: FixedCostRow,
  accounts: FixedCostAccount[] = [],
): FixedCost {
  return {
    id: row.id,
    tenantId: row.tenant_id,

    name: row.name,
    category: row.category,

    amount: Number(row.amount),
    frequency:
      row.frequency as FixedCostFrequency,

    dueDate: row.due_date,

    status: row.status as FixedCostStatus,

    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,

    accountId: row.account_id,
    vendor: row.vendor,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    account: row.account_id
      ? (accounts.find(
          (item) => item.id === row.account_id,
        ) ?? null)
      : null,
  };
}

function toPayload(
  input: CreateFixedCostInput,
) {
  return {
    name: input.name.trim(),
    category: input.category.trim(),

    amount: input.amount,
    frequency: input.frequency,

    due_date: input.dueDate || null,

    status: input.status,

    payment_date:
      input.status === "paid"
        ? input.paymentDate || null
        : null,

    payment_method:
      input.paymentMethod?.trim() || null,

    account_id: input.accountId || null,

    vendor: input.vendor?.trim() || null,

    notes: input.notes?.trim() || null,
  };
}

function validate(
  input: CreateFixedCostInput,
) {
  if (!input.name.trim()) {
    throw new Error("Cost name is required.");
  }

  if (!input.category.trim()) {
    throw new Error("Category is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error(
      "Amount must be greater than zero.",
    );
  }

  if (
    input.status === "paid" &&
    !input.paymentDate
  ) {
    throw new Error(
      "Payment date is required for a paid cost.",
    );
  }
}

/* =========================================================
 * ACCOUNTS (for the account selector)
 * ========================================================= */

export async function getFixedCostAccounts(): Promise<
  FixedCostAccount[]
> {
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
        is_active
      `,
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as FixedCostAccount["type"],
    accountNumber: row.account_number,
    currency: row.currency,
    isActive: row.is_active,
  }));
}

/* =========================================================
 * READ
 * ========================================================= */

export async function getFixedCosts(): Promise<
  FixedCost[]
> {
  const accounts =
    await getFixedCostAccounts();

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .select(FIXED_COST_SELECT)
    .order("due_date", {
      ascending: true,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as FixedCostRow[] | null) ?? []
  ).map((row) =>
    normalizeFixedCost(row, accounts),
  );
}

export async function getFixedCost(
  id: string,
): Promise<FixedCost> {
  const accounts =
    await getFixedCostAccounts();

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .select(FIXED_COST_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
    accounts,
  );
}

/* =========================================================
 * CREATE
 * ========================================================= */

export async function createFixedCost(
  input: CreateFixedCostInput,
): Promise<FixedCost> {
  validate(input);

  const tenantId =
    await getCurrentTenantId();

  const accounts =
    await getFixedCostAccounts();

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .insert({
      tenant_id: tenantId,
      ...toPayload(input),
    })
    .select(FIXED_COST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
    accounts,
  );
}

/* =========================================================
 * UPDATE
 * ========================================================= */

export async function updateFixedCost(
  id: string,
  input: UpdateFixedCostInput,
): Promise<FixedCost> {
  validate(input);

  const accounts =
    await getFixedCostAccounts();

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .update({
      ...toPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(FIXED_COST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
    accounts,
  );
}

/* =========================================================
 * QUICK STATUS CHANGE
 * ========================================================= */

export async function markFixedCostPaid(
  id: string,
  options?: {
    paymentDate?: string;
    paymentMethod?: string | null;
    accountId?: string | null;
  },
): Promise<FixedCost> {
  const accounts =
    await getFixedCostAccounts();

  const paymentDate =
    options?.paymentDate ??
    new Date().toISOString().slice(0, 10);

  const patch: Record<string, unknown> = {
    status: "paid",
    payment_date: paymentDate,
    updated_at: new Date().toISOString(),
  };

  if (
    options?.paymentMethod !== undefined
  ) {
    patch.payment_method =
      options.paymentMethod;
  }

  if (options?.accountId !== undefined) {
    patch.account_id = options.accountId;
  }

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .update(patch)
    .eq("id", id)
    .select(FIXED_COST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
    accounts,
  );
}

export async function updateFixedCostStatus(
  id: string,
  status: FixedCostStatus,
): Promise<FixedCost> {
  if (status === "paid") {
    return markFixedCostPaid(id);
  }

  const accounts =
    await getFixedCostAccounts();

  const { data, error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .update({
      status,
      payment_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(FIXED_COST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeFixedCost(
    data as FixedCostRow,
    accounts,
  );
}

/* =========================================================
 * DUPLICATE (next cycle এর জন্য কাজে লাগে)
 * ========================================================= */

export async function duplicateFixedCost(
  cost: FixedCost,
): Promise<FixedCost> {
  return createFixedCost({
    name: cost.name,
    category: cost.category,

    amount: cost.amount,
    frequency: cost.frequency,

    dueDate: nextDueDate(cost),

    status: "pending",

    paymentDate: null,
    paymentMethod: cost.paymentMethod,

    accountId: cost.accountId,
    vendor: cost.vendor,

    notes: cost.notes,
  });
}

function nextDueDate(
  cost: FixedCost,
): string | null {
  if (!cost.dueDate) {
    return null;
  }

  const date = new Date(
    `${cost.dueDate.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (cost.frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  }

  if (cost.frequency === "yearly") {
    date.setFullYear(
      date.getFullYear() + 1,
    );
  }

  return date.toISOString().slice(0, 10);
}

/* =========================================================
 * DELETE
 * ========================================================= */

export async function deleteFixedCost(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .schema("finance")
    .from("fixed_costs")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
