import { supabase } from "@/lib/supabase/client"; // Apnar project-er supabase client path adjust kore neben

export interface TradeTest {
  id: string;
  tenant_id: string;
  candidate_id: string;
  sl: number;
  test_center: string;
  test_date: string | null;
  result: "pending" | "pass" | "fail";
  certificate_no: string | null;
  expiry_date: string | null;
  status: "scheduled" | "completed" | "expired" | "cancelled";
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type TradeTestInput = {
  candidate_id: string;
  test_center: string;
  test_date?: string | null;
  result?: "pending" | "pass" | "fail";
  certificate_no?: string | null;
  expiry_date?: string | null;
  status?: "scheduled" | "completed" | "expired" | "cancelled";
  remarks?: string | null;
};

export async function getTradeTests(): Promise<TradeTest[]> {
  const { data, error } = await supabase
    .from("trade_tests")
    .select("*")
    .order("sl", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createTradeTest(input: TradeTestInput): Promise<TradeTest> {
  const { data, error } = await supabase
    .from("trade_tests")
    .insert([input])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateTradeTest(
  id: string,
  input: Partial<TradeTestInput>,
): Promise<TradeTest> {
  const { data, error } = await supabase
    .from("trade_tests")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteTradeTest(id: string): Promise<void> {
  const { error } = await supabase
    .from("trade_tests")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}