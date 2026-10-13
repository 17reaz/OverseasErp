
import { supabase } from "@/lib/supabase/client";
import type { PassportOcrResult } from "../types/passport-ocr-types";

export type PassportOcrJobStatus =
  | "queued"
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export type PassportOcrJobSnapshot = {
  jobId: string;
  status: PassportOcrJobStatus;
  result?: PassportOcrResult;
  errorMessage?: string;
};

type JobRow = {
  id: string;
  status: PassportOcrJobStatus;
  result: PassportOcrResult | null;
  error_message: string | null;
};

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export async function getPassportOcrJob(
  jobId: string,
): Promise<PassportOcrJobSnapshot> {
  const { data, error } = await supabase
    .from("passport_ocr_jobs")
    .select("id,status,result,error_message")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read OCR job: ${error.message}`);
  }

  if (!data) {
    throw new Error("OCR job was not found or you do not have access.");
  }

  const row = data as JobRow;

  if (
    !["queued", "uploaded", "processing", "completed", "failed"].includes(
      row.status,
    )
  ) {
    throw new Error("OCR service returned an unknown job status.");
  }

  return {
    jobId: row.id,
    status: row.status,
    ...(row.result ? { result: row.result } : {}),
    ...(row.error_message
      ? { errorMessage: row.error_message }
      : {}),
  };
}

export async function waitForPassportOcrResult(
  jobId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onStatus?: (snapshot: PassportOcrJobSnapshot) => void;
  },
): Promise<PassportOcrResult> {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 120000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const snapshot = await getPassportOcrJob(jobId);

    options?.onStatus?.(snapshot);

    if (snapshot.status === "completed") {
      if (!snapshot.result) {
        throw new Error("OCR completed but no result was saved.");
      }

      return snapshot.result;
    }

    if (snapshot.status === "failed") {
      throw new Error(snapshot.errorMessage || "Passport OCR failed.");
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }

  throw new Error(
    "Passport OCR is taking longer than expected. You can check the job again.",
  );
}

export function isPassportOcrJobFinished(
  status: PassportOcrJobStatus,
): boolean {
  return TERMINAL_STATUSES.has(status);
}
