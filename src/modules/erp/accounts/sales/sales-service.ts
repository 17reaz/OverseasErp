import { supabase } from "@/lib/supabase/client";

import type {
  CreateSaleInput,
  Sale,
  SaleStatus,
  UpdateSaleInput,
} from "./sales-types";

type SaleRow = {
  id: string;
  tenant_id: string;
  party_id: string | null;
  customer_name: string;
  service_name: string;
  description: string | null;
  amount: number | string;
  cost_amount: number | string;
  gross_profit: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  sale_date: string;
  status: SaleStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    partyId: row.party_id,
    customerName: row.customer_name,
    service: row.service_name,
    description: row.description,
    amount: Number(row.amount),
    costAmount: Number(row.cost_amount),
    grossProfit: Number(row.gross_profit),
    paidAmount: Number(row.paid_amount),
    dueAmount: Number(row.due_amount),
    saleDate: row.sale_date,
    status: row.status,
    notes: row.notes ?? "",
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const saleSelect = `
  id,
  tenant_id,
  party_id,
  customer_name,
  service_name,
  description,
  amount,
  cost_amount,
  gross_profit,
  paid_amount,
  due_amount,
  sale_date,
  status,
  notes,
  created_by,
  created_at,
  updated_at
`;

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("sales")
    .select(saleSelect)
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SaleRow[]).map(mapSale);
}

export async function createSale(
  input: CreateSaleInput,
): Promise<Sale> {
  const { data, error } = await supabase
    .schema("finance")
    .from("sales")
    .insert({
      party_id: input.partyId ?? null,
      customer_name: input.customerName.trim(),
      service_name: input.service.trim(),
      description: input.description?.trim() || null,
      amount: input.amount,
      cost_amount: input.costAmount,
      paid_amount: input.paidAmount ?? 0,
      sale_date: input.saleDate,
      status: input.status,
      notes: input.notes?.trim() || null,
    })
    .select(saleSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSale(data as SaleRow);
}

export async function updateSale(
  saleId: string,
  input: UpdateSaleInput,
): Promise<Sale> {
  const { data, error } = await supabase
    .schema("finance")
    .from("sales")
    .update({
      ...(input.partyId !== undefined && {
        party_id: input.partyId,
      }),
      ...(input.customerName !== undefined && {
        customer_name: input.customerName.trim(),
      }),
      ...(input.service !== undefined && {
        service_name: input.service.trim(),
      }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.amount !== undefined && {
        amount: input.amount,
      }),
      ...(input.costAmount !== undefined && {
        cost_amount: input.costAmount,
      }),
      ...(input.paidAmount !== undefined && {
        paid_amount: input.paidAmount,
      }),
      ...(input.saleDate !== undefined && {
        sale_date: input.saleDate,
      }),
      ...(input.status !== undefined && {
        status: input.status,
      }),
      ...(input.notes !== undefined && {
        notes: input.notes?.trim() || null,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", saleId)
    .select(saleSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSale(data as SaleRow);
}