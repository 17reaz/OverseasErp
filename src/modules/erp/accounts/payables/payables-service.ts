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

export async function getPayables(): Promise<Payable[]> {
  // Temporary implementation until finance.payables
  // is connected to the database.
  //
  // Keep this service boundary now so the page does not
  // need to change when the real payable table is added.

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

  return (data ?? []) as Payable[];
}