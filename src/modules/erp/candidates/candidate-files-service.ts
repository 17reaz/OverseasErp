import { supabase } from "@/lib/supabase/client";

const PASSPORT_BUCKET = "passports";
const VISA_BUCKET = "visas";
const MOFA_BUCKET = "mofas";
export interface CandidateFile {
  id: number;
  tenant_id: string;
  candidate_id: string;
  doc_type: string;
  file_location: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the active document version.
 */
export async function getActiveCandidateFile(
  candidateId: string,
  docType: string,
): Promise<CandidateFile | null> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;

  return data as CandidateFile | null;
}
/**
 * Get active document records for the Visa table.
 * File contents remain in the existing private Storage bucket.
 */
export async function getActiveCandidateFiles(
  docType: string,
): Promise<CandidateFile[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("doc_type", docType)
    .eq("is_active", true);

  if (error) throw error;

  return (data ?? []) as CandidateFile[];
}
/**
 * Get document version history.
 */
export async function getCandidateFileVersions(
  candidateId: string,
  docType: string,
): Promise<CandidateFile[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .order("version", { ascending: false });

  if (error) throw error;

  return (data ?? []) as CandidateFile[];
}

/**
 * Shared upload implementation.
 * Uploads to the requested private bucket and records the version.
 */
async function uploadCandidateDocument({
  bucket,
  docType,
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  file,
}: {
  bucket: string;
  docType: "passport" | "visa" | "mofa";
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  file: File;
}): Promise<CandidateFile> {
  if (!tenantId || !candidateId) {
    throw new Error("Candidate tenant and ID are required.");
  }

  if (!file) {
    throw new Error("Please select a file.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are supported.");
  }

  // Keep the existing 5 MB limit consistent with Passport storage.
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must not exceed 5 MB.");
  }

  const { data: currentFiles, error: listError } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .order("version", { ascending: false });

  if (listError) throw listError;

  const versions = (currentFiles ?? []) as CandidateFile[];
  const currentFile = versions.find((item) => item.is_active) ?? null;
  const nextVersion =
    versions.reduce((max, item) => Math.max(max, item.version ?? 0), 0) + 1;

  const safeName =
    candidateName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "candidate";

  const safePassportNo =
    passportNo.trim().replace(/[^a-zA-Z0-9_-]/g, "") || "passport";

  const extension =
    file.name.split(".").pop()?.toLowerCase() || "bin";

  const fileName =
    `${candidateSl}-${safeName}-${safePassportNo}-${docType}-v${nextVersion}.${extension}`;

  const filePath = `${tenantId}/${candidateId}/${fileName}`;

  // 1. Upload the new file first.
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  // 2. Insert the new document record.
  const { data, error: insertError } = await supabase
    .from("files")
    .insert({
      tenant_id: tenantId,
      candidate_id: candidateId,
      doc_type: docType,
      file_location: filePath,
      version: nextVersion,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    // Best-effort cleanup if the database insert fails.
    await supabase.storage.from(bucket).remove([filePath]);
    throw insertError;
  }

  // 3. Mark previous active version inactive.
  if (currentFile) {
    const { error: updateError } = await supabase
      .from("files")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentFile.id);

    if (updateError) {
      // Keep the new record; report that version activation needs attention.
      throw updateError;
    }
  }

  return data as CandidateFile;
}

/**
 * Upload a Passport copy to the existing passports bucket.
 */
export async function uploadCandidatePassport({
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  file,
}: {
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  file: File;
}): Promise<CandidateFile> {
  return uploadCandidateDocument({
    bucket: PASSPORT_BUCKET,
    docType: "passport",
    tenantId,
    candidateId,
    candidateSl,
    candidateName,
    passportNo,
    file,
  });
}

/**
 * Upload a Visa copy to the separate visas bucket.
 */
export async function uploadCandidateVisa({
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  file,
}: {
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  file: File;
}): Promise<CandidateFile> {
  return uploadCandidateDocument({
    bucket: VISA_BUCKET,
    docType: "visa",
    tenantId,
    candidateId,
    candidateSl,
    candidateName,
    passportNo,
    file,
  });
}

/**
 * Create a signed URL for a Passport file.
 */
export async function getCandidateFileUrl(
  fileLocation: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PASSPORT_BUCKET)
    .createSignedUrl(fileLocation, 60 * 10);

  if (error) throw error;

  return data.signedUrl;
}

/**
 * Create a signed URL for a Visa file.
 */
export async function getCandidateVisaFileUrl(
  fileLocation: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(VISA_BUCKET)
    .createSignedUrl(fileLocation, 60 * 10);

  if (error) throw error;

  return data.signedUrl;
}

/**
 * Upload a MOFA copy to the separate mofas bucket.
 */
export async function uploadCandidateMofa({
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  file,
}: {
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  file: File;
}): Promise<CandidateFile> {
  return uploadCandidateDocument({
    bucket: MOFA_BUCKET,
    docType: "mofa",
    tenantId,
    candidateId,
    candidateSl,
    candidateName,
    passportNo,
    file,
  });
}

/**
 * Create a signed URL for a MOFA file.
 */
export async function getCandidateMofaFileUrl(
  fileLocation: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MOFA_BUCKET)
    .createSignedUrl(fileLocation, 60 * 10);

  if (error) throw error;

  return data.signedUrl;
}
