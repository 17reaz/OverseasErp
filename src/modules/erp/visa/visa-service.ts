import { supabase } from "@/lib/supabase/client";
import { updateCandidateStage } from "../candidates/candidate-service";

import { syncCandidateWorkflowState } from "../workflow/workflow-service";

export interface Visa {
  id: string;
  tenant_id: string;
  candidate_id: string;
  mofa_id: string | null;
  sl: number;
  visa_no: string;
  visa_date: string | null;
  expiry_date: string | null;
  visa_type: string;
  status: string;
  agency_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type VisaInput = {
  candidate_id: string;
  mofa_id?: string | null;
  visa_no: string;
  visa_date?: string | null;
  expiry_date?: string | null;
  visa_type?: string;
  status?: string;
  agency_id?: string | null;
  remarks?: string | null;
    advance_stage?: boolean;
};

export async function getVisas(): Promise<Visa[]> {
  const { data, error } = await supabase
    .from("visas")
    .select("*")
    .order("sl", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createVisa(input: VisaInput): Promise<Visa> {
  const {
    advance_stage,
    ...visaData
  } = input;

  const { data, error } = await supabase
    .from("visas")
    .insert([visaData])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (advance_stage !== false) {
    try {
      await updateCandidateStage(
        data.candidate_id,
        "visa",
      );
    } catch (stageError) {
      console.error(
        "Failed to auto-advance candidate stage to visa:",
        stageError,
      );
    }
  }

  try {
    await syncCandidateWorkflowState(
      data.candidate_id,
    );
  } catch (workflowError) {
    console.error(
      "Failed to sync candidate workflow state after visa create:",
      workflowError,
    );
  }

  return data;
}

export async function updateVisa(
  id: string,
  input: Partial<VisaInput>,
): Promise<Visa> {
  const { data, error } = await supabase
    .from("visas")
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
      "Failed to sync candidate workflow state after visa update:",
      workflowError,
    );
  }

  return data;
}

export async function deleteVisa(id: string): Promise<void> {
  const { error } = await supabase
    .from("visas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}