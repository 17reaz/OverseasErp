import { classifyDocument } from "@/modules/erp/ocr/new/services/document-classifier";
import { readPassportDocument } from "@/modules/erp/ocr/new/services/passport-ocr-provider";
import { extractWafidMedical } from "@/modules/erp/ocr/new/services/wafid-reder";
import { readMofa } from "@/modules/erp/ocr/new/services/mofa-reader";
import { extractKsaVisa } from "@/modules/erp/ocr/new/services/kisa-visa";

export type GlobalDocumentType = "passport" | "medical" | "mofa" | "visa";

export type GlobalDocumentField = {
  key: string;
  label: string;
  value: string;
  /** UX helper: true when the field has no value, so the UI can highlight it. */
  empty?: boolean;
};

export type GlobalDocumentResult = {
  docType: GlobalDocumentType;
  /** UX helper: human-friendly document name for headings and badges. */
  docTypeLabel?: string;
  fileName: string;
  fields: GlobalDocumentField[];
  warnings: string[];
  /** UX helper: true when the user should check something before saving. */
  needsReview?: boolean;
  raw: Record<string, unknown>;
};

const SUPPORTED_TYPES: GlobalDocumentType[] = [
  "passport",
  "medical",
  "mofa",
  "visa",
];

const DOCUMENT_TYPE_LABELS: Record<GlobalDocumentType, string> = {
  passport: "Passport",
  medical: "Medical Report",
  mofa: "MOFA Document",
  visa: "Saudi Visa",
};

/** Words that should keep a fixed, readable form inside labels. */
const LABEL_WORDS: Record<string, string> = {
  id: "ID",
  dob: "DOB",
  mrz: "MRZ",
  mofa: "MOFA",
  ksa: "KSA",
  uid: "UID",
  nid: "NID",
  url: "URL",
  no: "No.",
  num: "No.",
  nationality: "Nationality",
};

const HIDDEN_FIELD_KEYS = [
  "rawText",
  "confidence",
  "source",
  "checks",
  "verified",
];

function isSupportedType(value: unknown): value is GlobalDocumentType {
  return SUPPORTED_TYPES.includes(value as GlobalDocumentType);
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      return (
        LABEL_WORDS[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1)
      );
    })
    .join(" ");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" | ");
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeFields(
  data: Record<string, unknown>,
): GlobalDocumentField[] {
  return Object.entries(data)
    .filter(([key]) => !HIDDEN_FIELD_KEYS.includes(key))
    .map(([key, value]) => {
      const formatted = formatValue(value);

      return {
        key,
        label: formatLabel(key),
        value: formatted,
        empty: !formatted.trim(),
      };
    });
}

function reviewMessage(field: unknown): string {
  return `Please double-check: ${formatLabel(String(field))}`;
}

function getWarnings(
  docType: GlobalDocumentType,
  data: Record<string, unknown>,
): string[] {
  const warnings: string[] = [];

  if (docType === "visa" && Array.isArray(data.warnings)) {
    warnings.push(...data.warnings.map(String));
  }

  if (docType === "mofa" && Array.isArray(data.reviewFields)) {
    warnings.push(...data.reviewFields.map(reviewMessage));
  }

  if (docType === "passport" && Array.isArray(data.reviewFields)) {
    warnings.push(...data.reviewFields.map(reviewMessage));
  }

  const emptyFields = normalizeFields(data).filter(
    (field) => !field.value.trim(),
  );

  if (emptyFields.length > 0) {
    warnings.push(
      `Could not read ${emptyFields.length} field(s): ${emptyFields
        .map((field) => field.label)
        .join(", ")}. Please fill them in manually.`,
    );
  }

  if (data.verified === false) {
    warnings.push(
      "Passport MRZ check did not pass. Please compare the details with the printed passport.",
    );
  }

  return [...new Set(warnings)];
}

/**
 * Suggest a document type using the existing classifier.
 * Classification is a suggestion; the caller can let the user override it.
 */
export async function suggestGlobalDocumentType(file: File) {
  const result = await classifyDocument(file);
  const docType = isSupportedType(result.docType) ? result.docType : null;

  return {
    docType,
    label: docType ? DOCUMENT_TYPE_LABELS[docType] : null,
    confidence: result.confidence,
    reason: result.reason,
    scores: result.scores,
  };
}

/**
 * Read a document using the existing OCR implementation.
 * This function does not save records or mutate Candidate Registration state.
 */
export async function extractGlobalDocument(
  file: File,
  docType: GlobalDocumentType,
): Promise<GlobalDocumentResult> {
  let result: object;

  switch (docType) {
    case "passport":
      result = await readPassportDocument(file);
      break;

    case "medical":
      result = await extractWafidMedical(file);
      break;

    case "mofa":
      result = await readMofa(file);
      break;

    case "visa":
      result = await extractKsaVisa(file);
      break;

    default: {
      const unsupported: never = docType;
      throw new Error(`Unsupported document type: ${unsupported}`);
    }
  }

  const raw = result as Record<string, unknown>;
  const warnings = getWarnings(docType, raw);

  return {
    docType,
    docTypeLabel: DOCUMENT_TYPE_LABELS[docType],
    fileName: file.name,
    fields: normalizeFields(raw),
    warnings,
    needsReview: warnings.length > 0,
    raw,
  };
}