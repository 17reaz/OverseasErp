import { supabase } from "@/lib/supabase/client";

const BUCKET = "passports";

interface CandidateFile {
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
 * Get the current active document
 */
export async function getActiveCandidateFile(
  candidateId: string,
  docType: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CandidateFile | null;
}

/**
 * Get all versions of a document
 */
export async function getCandidateFileVersions(
  candidateId: string,
  docType: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .order("version", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as CandidateFile[];
}

/**
 * Upload a new passport version
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
}) {
  /*
   * 1. Get current active version
   */

  const currentFile =
    await getActiveCandidateFile(
      candidateId,
      "passport",
    );

  const nextVersion =
    currentFile?.version
      ? currentFile.version + 1
      : 1;

  /*
   * 2. Make safe filename
   */

  const safeName = candidateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safePassportNo = passportNo
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const fileName =
    `${candidateSl}-${safeName}-${safePassportNo}-passport-v${nextVersion}.${extension}`;

  /*
   * 3. Storage path
   */

  const filePath =
    `${tenantId}/${candidateId}/${fileName}`;

  /*
   * 4. Upload to Supabase Storage
   */

  const {
    error: uploadError,
  } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  /*
   * 5. Disable previous active version
   */

  if (currentFile) {
    const {
      error: updateError,
    } = await supabase
      .from("files")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentFile.id);

    if (updateError) {
      /*
       * Upload succeeded but database update failed.
       * Throw so caller knows something went wrong.
       */
      throw updateError;
    }
  }

  /*
   * 6. Insert new file record
   */

  const {
    data,
    error: insertError,
  } = await supabase
    .from("files")
    .insert({
      tenant_id: tenantId,
      candidate_id: candidateId,
      doc_type: "passport",
      file_location: filePath,
      version: nextVersion,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return data as CandidateFile;
}

/**
 * Create a temporary signed URL
 * for viewing/downloading private files.
 */
export async function getCandidateFileUrl(
  fileLocation: string,
) {
  const {
    data,
    error,
  } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      fileLocation,
      60 * 10,
    );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}