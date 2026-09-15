import { supabase } from "@/lib/supabase/client";

export type FixedCostFrequency =
  | "monthly"
  | "yearly"
  | "one_time";

export type FixedCostStatus =
  | "pending"
  | "paid"
  | "cancelled";

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
}

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

export async function getFixedCosts(): Promise<FixedCost[]> {
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
  ).map(normalizeFixedCost);
}

export async function getFixedCost(
  id: string,
): Promise<FixedCost> {
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
  );
}

function normalizeFixedCost(
  row: FixedCostRow,
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

    status:
      row.status as FixedCostStatus,

    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,

    accountId: row.account_id,
    vendor: row.vendor,

    notes: row.notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}