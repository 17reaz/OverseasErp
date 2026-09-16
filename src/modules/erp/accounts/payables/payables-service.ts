import { supabase } from "@/lib/supabase/client";

export interface Payable {
  id: string;
  partyId: string | null;
  vendorName: string;
  description: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string | null;
  status: "open" | "partial" | "paid" | "cancelled";
}

interface PayableRow {
  id: string;
  party_id: string | null;
  vendor_name: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string | null;
  status: Payable["status"];
}

function mapPayable(row: PayableRow): Payable {
  return {
    id: row.id,
    partyId: row.party_id,
    vendorName: row.vendor_name,
    description: row.description,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    dueAmount: Number(row.due_amount),
    dueDate: row.due_date,
    status: row.status,
  };
}

export async function getPayables(): Promise<Payable[]> {
  const { data, error } = await supabase
    .schema("finance")
    .from("payables")
    .select(`
      id,
      party_id,
      vendor_name,
      description,
      amount,
      paid_amount,
      due_amount,
      due_date,
      status
    `)
    .gt("due_amount", 0)
    .neq("status", "cancelled")
    .order("due_date", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to load payables: ${error.message}`,
    );
  }

  return (data ?? []).map(
    (row) => mapPayable(row as PayableRow),
  );
}