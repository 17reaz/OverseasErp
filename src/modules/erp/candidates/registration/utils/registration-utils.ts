import type { MedicalStatus } from "../../../medical/medical-service";
import { findCandidateByPassport } from "../../candidate-service";
import { MAX_FILE_SIZE, NOT_DETECTED } from "../constants";
import type { DocType, OcrField } from "../types";

export const today = () => new Date().toISOString().slice(0, 10);

export function normalizePassport(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  const message = (error as { message?: string } | null)?.message;
  return message || fallback;
}

export function isDuplicateError(error: unknown) {
  const err = error as { message?: string; code?: string } | null;
  const message = (err?.message ?? "").toLowerCase();
  return (
    err?.code === "23505" ||
    message.includes("duplicate") ||
    message.includes("unique")
  );
}

/** Wafid date format: DD/MM/YYYY → YYYY-MM-DD */
export function toInputDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

export function toMedicalStatus(value: string): MedicalStatus {
  const status = value.trim().toLowerCase();
  if (status === "fit") return "fit";
  if (status === "unfit") return "unfit";
  return "under_review";
}

export function field(label: string, value?: string | null): OcrField {
  return { label, value: value || NOT_DETECTED };
}

export async function lookupPassport(value: string) {
  const result = await findCandidateByPassport(value);

  if (result.error) {
    // Not blocking: the DB unique constraint is the last line of defence.
    console.error("Passport lookup failed:", result.error);
    return null;
  }

  return result.data;
}

/** Returns an error message if the file is not valid for the doc type, else null. */
export function validateScanFile(docType: DocType, file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be 10 MB or less.";
  }

  const isPdf = isPdfFile(file);
  const isImage = file.type.startsWith("image/");

  if (docType === "passport" && !isImage) {
    return "Upload a JPG or PNG image for Passport OCR.";
  }
  if (docType === "medical" && !isPdf) {
    return "Upload a PDF file for Wafid Medical OCR.";
  }
  if (docType === "mofa" && !isPdf && !isImage) {
    return "Upload a PDF, JPG or PNG file for MOFA OCR.";
  }
  if (docType === "visa" && !isPdf) {
    return "Upload a PDF file for Saudi Visa OCR.";
  }

  return null;
}
