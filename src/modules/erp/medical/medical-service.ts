import { supabase } from "@/lib/supabase/client";

export type MedicalStatus =
  | "new"
  | "fit"
  | "unfit"
  | "expired";

export interface MedicalCandidate {
  id: string;
  name: string;
  passport_no: string;
  received_date: string | null;
}

export interface Medical {
  id: string;
  tenant_id: string;
  candidate_id: string;
  medical_date: string | null;
  fit_date: string | null;
  status: MedicalStatus;
  created_at: string;
  updated_at: string;
  candidate?: MedicalCandidate | null;
}

export interface MedicalInput {
  candidate_id: string;
  medical_date: string | null;
  fit_date: string | null;
  status: MedicalStatus;
}

export async function getMedicals() {
  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no,
        received_date
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  return {
    data: data as Medical[] | null,
    error,
  };
}

export async function createMedical(
  input: MedicalInput,
) {
  const {
    data: {
      user,
    },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.tenant_id) {
    throw new Error(
      "Tenant information is missing.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .insert({
      tenant_id: profile.tenant_id,
      candidate_id: input.candidate_id,
      medical_date:
        input.medical_date || null,
      fit_date:
        input.status === "fit"
          ? input.fit_date || null
          : null,
      status: input.status,
    })
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no,
        received_date
      )
    `)
    .single();

  return {
    data: data as Medical | null,
    error,
  };
}

export async function updateMedical(
  id: string,
  input: MedicalInput,
) {
  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .update({
      candidate_id: input.candidate_id,
      medical_date:
        input.medical_date || null,
      fit_date:
        input.status === "fit"
          ? input.fit_date || null
          : null,
      status: input.status,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no,
        received_date
      )
    `)
    .single();

  return {
    data: data as Medical | null,
    error,
  };
}

export async function deleteMedical(
  id: string,
) {
  const {
    error,
  } = await supabase
    .from("medicals")
    .delete()
    .eq("id", id);

  return {
    error,
  };
}

export async function getCandidatesWithoutMedical() {
  const {
    data: candidates,
    error: candidatesError,
  } = await supabase
    .from("candidates")
    .select(`
      id,
      name,
      passport_no,
      received_date
    `)
    .order("sl", {
      ascending: false,
    });

  if (candidatesError) {
    return {
      data: null,
      error: candidatesError,
    };
  }

  const {
    data: medicals,
    error: medicalError,
  } = await supabase
    .from("medicals")
    .select("candidate_id");

  if (medicalError) {
    return {
      data: null,
      error: medicalError,
    };
  }

  const medicalCandidateIds =
    new Set(
      (medicals ?? []).map(
        (item) =>
          item.candidate_id,
      ),
    );

  const pending =
    (candidates ?? []).filter(
      (candidate) =>
        !medicalCandidateIds.has(
          candidate.id,
        ),
    );

  return {
    data:
      pending as MedicalCandidate[],
    error: null,
  };
}