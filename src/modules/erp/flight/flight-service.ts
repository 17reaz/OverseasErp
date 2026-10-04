import { supabase } from "@/lib/supabase/client";
import { syncCandidateWorkflowState } from "../workflow/workflow-service";

export interface Flight {
  id: string;
  tenant_id: string;
  candidate_id: string;
  visa_id: string | null;
  sl: number;
  flight_date: string | null;
  flight_no: string | null;
  airline: string | null;
  departure_city: string | null;
  arrival_city: string | null;
  status: "scheduled" | "departed" | "cancelled" | "rescheduled";
  // Iqama
  needs_iqama: boolean;
  iqama_status: "pending" | "completed" | "cancelled" | null;
  iqama_number: string | null;
  iqama_date: string | null;
  iqama_expiry_date: string | null;
  iqama_remarks: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type FlightInput = {
  candidate_id: string;
  visa_id?: string | null;
  flight_date?: string | null;
  flight_no?: string | null;
  airline?: string | null;
  departure_city?: string | null;
  arrival_city?: string | null;
  status?: "scheduled" | "departed" | "cancelled" | "rescheduled";
    needs_iqama?: boolean;
  iqama_status?: "pending" | "completed" | "cancelled" | null;
  iqama_number?: string | null;
  iqama_date?: string | null;
  iqama_expiry_date?: string | null;
  iqama_remarks?: string | null;
  remarks?: string | null;
};

export async function getFlights(): Promise<Flight[]> {
  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .order("sl", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
export async function markIqamaComplete(
  id: string,
  input?: {
    iqama_number?: string | null;
    iqama_date?: string | null;
    iqama_expiry_date?: string | null;
    iqama_remarks?: string | null;
  },
): Promise<Flight> {
  const { data: current, error: currentError } = await supabase
    .from("flights")
    .select("id, candidate_id, status, needs_iqama")
    .eq("id", id)
    .single();

  if (currentError) {
    throw new Error(currentError.message);
  }

  if (current.status !== "departed") {
    throw new Error(
      "Iqama can only be completed after the candidate has departed.",
    );
  }

  if (!current.needs_iqama) {
    throw new Error(
      "Iqama is not required for this flight.",
    );
  }

  const { data, error } = await supabase
    .from("flights")
    .update({
      iqama_status: "completed",
      iqama_number: input?.iqama_number?.trim() || null,
      iqama_date:
        input?.iqama_date ||
        new Date().toISOString().slice(0, 10),
      iqama_expiry_date:
        input?.iqama_expiry_date || null,
      iqama_remarks:
        input?.iqama_remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncCandidateWorkflowState(data.candidate_id);

  return data;
}
export async function createFlight(input: FlightInput): Promise<Flight> {
  const { data, error } = await supabase
    .from("flights")
    .insert([input])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await syncCandidateWorkflowState(data.candidate_id);
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after flight create:",
      workflowError,
    );
  }

  return data;
}

export async function updateFlight(
  id: string,
  input: Partial<FlightInput>,
): Promise<Flight> {
  const { data, error } = await supabase
    .from("flights")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await syncCandidateWorkflowState(data.candidate_id);
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after flight update:",
      workflowError,
    );
  }

  return data;
}

export async function deleteFlight(
  id: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("flights")
    .delete()
    .eq("id", id)
    .select("candidate_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await syncCandidateWorkflowState(
      data.candidate_id,
    );
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after flight delete:",
      workflowError,
    );
  }
}