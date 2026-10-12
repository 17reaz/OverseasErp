
import { supabase } from "@/lib/supabase/client";

export type PassportS3UploadResult = {
  jobId: string;
  objectKey: string;
  contentType: string;
  fileName: string;
  fileSize: number;
};

type UploadUrlResponse = {
  jobId: string;
  uploadUrl: string;
  objectKey: string;
  headers?: Record<string, string>;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function getContentType(file: File): string {
  if (ALLOWED_TYPES.has(file.type)) return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase();

  const extensionTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
  };

  return extensionTypes[extension ?? ""] ?? "";
}

export async function uploadPassportToS3(
  file: File,
): Promise<PassportS3UploadResult> {
  if (!file || file.size <= 0) {
    throw new Error("Please select a passport file.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Passport file must be 15 MB or smaller.");
  }

  const contentType = getContentType(file);

  if (!contentType) {
    throw new Error("Unsupported file. Use JPG, PNG, WEBP, or PDF.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Please sign in again before uploading.");
  }

  const { data, error } = await supabase.functions.invoke(
    "passport-ocr-upload-url",
    {
      body: {
        fileName: file.name,
        contentType,
        fileSize: file.size,
      },
    },
  );

  if (error) {
    throw new Error(`Could not prepare S3 upload: ${error.message}`);
  }

  const target = data as UploadUrlResponse | null;

  if (!target?.jobId || !target.uploadUrl || !target.objectKey) {
    throw new Error("Upload service returned an invalid response.");
  }

  const uploadResponse = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: target.headers ?? { "Content-Type": contentType },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed with HTTP ${uploadResponse.status}.`);
  }

  const { data: markData, error: markError } =
    await supabase.functions.invoke("passport-ocr-mark-uploaded", {
      body: {
        jobId: target.jobId,
        objectKey: target.objectKey,
      },
    });

  if (markError || !markData?.success) {
    // The file may already be in S3. Keep the job ID so it can be
    // diagnosed or reconciled instead of pretending the upload failed.
    throw new Error(
      `Passport uploaded, but job status update failed. Job ID: ${target.jobId}`,
    );
  }

  return {
    jobId: target.jobId,
    objectKey: target.objectKey,
    contentType,
    fileName: file.name,
    fileSize: file.size,
  };
}
