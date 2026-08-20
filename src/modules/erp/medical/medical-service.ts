import {
  supabase,
} from "@/lib/supabase/client";

export type MedicalStatus =
  | "new"
  | "fit"
  | "unfit"
  | "expired";

export interface MedicalCandidate {
  id: string;
  name: string;
  passport_no: string;
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


// =====================================================
// CURRENT TENANT
// =====================================================

export async function getCurrentTenantId() {
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
    .eq(
      "id",
      user.id,
    )
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.tenant_id) {
    throw new Error(
      "No tenant is assigned to this user.",
    );
  }

  return profile.tenant_id as string;
}


// =====================================================
// GET MEDICALS
// =====================================================

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
        passport_no
      )
    `)
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  return {
    data: data as Medical[] | null,
    error,
  };
}


// =====================================================
// GET SINGLE MEDICAL
// =====================================================

export async function getMedical(
  id: string,
) {
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
        passport_no
      )
    `)
    .eq(
      "id",
      id,
    )
    .single();

  return {
    data: data as Medical | null,
    error,
  };
}


// =====================================================
// CREATE
// =====================================================

export async function createMedical(
  input: MedicalInput,
) {
  const tenantId =
    await getCurrentTenantId();

  const {
    data,
    error,
  } = await supabase
    .from("medicals")
    .insert({
      tenant_id:
        tenantId,

      candidate_id:
        input.candidate_id,

      medical_date:
        input.medical_date ||
        null,

      fit_date:
        input.status === "fit"
          ? input.fit_date ||
            null
          : null,

      status:
        input.status,
    })
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .single();

  return {
    data: data as Medical | null,
    error,
  };
}


// =====================================================
// UPDATE
// =====================================================

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
      candidate_id:
        input.candidate_id,

      medical_date:
        input.medical_date ||
        null,

      fit_date:
        input.status === "fit"
          ? input.fit_date ||
            null
          : null,

      status:
        input.status,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      id,
    )
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        passport_no
      )
    `)
    .single();

  return {
    data: data as Medical | null,
    error,
  };
}


// =====================================================
// DELETE
// =====================================================

export async function deleteMedical(
  id: string,
) {
  const {
    error,
  } = await supabase
    .from("medicals")
    .delete()
    .eq(
      "id",
      id,
    );

  return {
    error,
  };
}


// =====================================================
// GET CANDIDATES FOR PICKER
// =====================================================

export async function getMedicalCandidates() {
  const {
    data,
    error,
  } = await supabase
    .from("candidates")
    .select(`
      id,
      name,
      passport_no
    `)
    .eq(
      "is_deleted",
      false,
    )
    .order(
      "sl",
      {
        ascending: false,
      },
    );

  return {
    data:
      data as MedicalCandidate[] | null,

    error,
  };
}