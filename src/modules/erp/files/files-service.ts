import { supabase } from "@/lib/supabase/client";

import type {
  DocumentType,
  FileRecord,
} from "./types";

const BUCKET = "passports";

/**
 * Get the currently active file
 * for a candidate + document type.
 */
export async function getActiveFile(
  candidateId: string,
  docType: DocumentType,
) {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("doc_type", docType)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as FileRecord | null;
}

/**
 * Get all versions of a candidate document.
 */
export async function getFileVersions(
  candidateId: string,
  docType: DocumentType,
) {
  const { data, error } = await supabase
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

  return (data ?? []) as FileRecord[];
}

/**
 * Upload a new file.
 */
export async function uploadFile({
  tenantId,
  candidateId,
  candidateSl,
  candidateName,
  passportNo,
  docType,
  file,
}: {
  tenantId: string;
  candidateId: string;
  candidateSl: number;
  candidateName: string;
  passportNo: string;
  docType: DocumentType;
  file: File;
}) {
  /*
   * 1. Get current active version
   */

  const currentFile = await getActiveFile(
    candidateId,
    docType,
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
    file.name.split(".").pop()?.toLowerCase() ||
    "bin";

  /*
   * 3. Create filename
   */

  const fileName =
    `${candidateSl}-${safeName}-${safePassportNo}-${docType}-v${nextVersion}.${extension}`;

  /*
   * 4. Storage path
   */

  const filePath =
    `${tenantId}/${candidateId}/${fileName}`;

  /*
   * 5. Upload to Storage
   */

  const { error: uploadError } =
    await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    throw uploadError;
  }

  /*
   * 6. Disable old active version
   */

  if (currentFile) {
    const { error: updateError } =
      await supabase
        .from("files")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentFile.id);

    if (updateError) {
      throw updateError;
    }
  }

  /*
   * 7. Insert new database record
   */

  const { data, error: insertError } =
    await supabase
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
    throw insertError;
  }

  return data as FileRecord;
}

/**
 * Create a temporary URL for a private file.
 */
export async function getFileUrl(
  fileLocation: string,
) {
  const { data, error } =
    await supabase.storage
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
export async function getAllFiles(
  tenantId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("files")
    .select(`
      id,
      tenant_id,
      candidate_id,
      doc_type,
      file_location,
      version,
      is_active,
      created_at,
      updated_at,
      candidates (
        id,
        sl,
        name,
        passport_no
      )
    `)
    .eq(
      "tenant_id",
      tenantId,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (file) => ({
      ...file,
      candidate: Array.isArray(
        file.candidates,
      )
        ? file.candidates[0]
        : file.candidates,
    }),
  );
}