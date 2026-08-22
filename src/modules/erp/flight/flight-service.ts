import { supabase } from "@/lib/supabase/client";

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

export async function createFlight(input: FlightInput): Promise<Flight> {
  const { data, error } = await supabase
    .from("flights")
    .insert([input])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
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

  return data;
}

export async function deleteFlight(id: string): Promise<void> {
  const { error } = await supabase
    .from("flights")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}