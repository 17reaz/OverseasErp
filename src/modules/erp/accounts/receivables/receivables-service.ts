import { supabase } from "@/lib/supabase/client";

export interface Receivable {
  id: string;
  partyId: string | null;
  customerName: string;
  service: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  saleDate: string;
  status: "draft" | "confirmed" | "paid" | "cancelled";
}

interface SaleRow {
  id: string;
  party_id: string | null;
  customer_name: string;
  service_name: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  sale_date: string;
  status: Receivable["status"];
}

function mapReceivable(row: SaleRow): Receivable {
  return {
    id: row.id,
    partyId: row.party_id,
    customerName: row.customer_name,
    service: row.service_name,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    dueAmount: Number(row.due_amount),
    saleDate: row.sale_date,
    status: row.status,
  };
}

export async function getReceivables(): Promise<Receivable[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("sales")
    .select(`
      id,
      party_id,
      customer_name,
      service_name,
      amount,
      paid_amount,
      due_amount,
      sale_date,
      status
    `)
    .gt("due_amount", 0)
    .neq("status", "cancelled")
    .order("sale_date", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load receivables: ${error.message}`,
    );
  }

  return (data as SaleRow[]).map(
    mapReceivable,
  );
}