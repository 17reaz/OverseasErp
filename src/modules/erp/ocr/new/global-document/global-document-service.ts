
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
};

export type GlobalDocumentResult = {
  docType: GlobalDocumentType;
  fileName: string;
  fields: GlobalDocumentField[];
  warnings: string[];
  raw: Record<string, unknown>;
};

const SUPPORTED_TYPES: GlobalDocumentType[] = [
  "passport",
  "medical",
  "mofa",
  "visa",
];

function isSupportedType(value: unknown): value is GlobalDocumentType {
  return SUPPORTED_TYPES.includes(value as GlobalDocumentType);
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function normalizeFields(
  data: Record<string, unknown>,
): GlobalDocumentField[] {
  return Object.entries(data)
    .filter(
      ([key]) =>
        !["rawText", "confidence", "source", "checks", "verified"].includes(key),
    )
    .map(([key, value]) => ({
      key,
      label: formatLabel(key),
      value: Array.isArray(value)
        ? value.map(String).join(" | ")
        : value == null
          ? ""
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
    }));
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
    warnings.push(
      ...data.reviewFields.map((field) => `Please review: ${String(field)}`),
    );
  }

  if (docType === "passport" && Array.isArray(data.reviewFields)) {
    warnings.push(
      ...data.reviewFields.map((field) => `Please review: ${String(field)}`),
    );
  }

  const emptyFields = normalizeFields(data).filter(
    (field) => !field.value.trim(),
  );

  if (emptyFields.length > 0) {
    warnings.push(
      `${emptyFields.length} field(s) are empty. Review them manually.`,
    );
  }

  if (data.verified === false) {
    warnings.push("Passport MRZ verification did not pass.");
  }

  return [...new Set(warnings)];
}

/**
 * Suggest a document type using the existing classifier.
 * Classification is a suggestion; the caller can let the user override it.
 */
export async function suggestGlobalDocumentType(file: File) {
  const result = await classifyDocument(file);

  return {
    docType: isSupportedType(result.docType) ? result.docType : null,
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

  return {
    docType,
    fileName: file.name,
    fields: normalizeFields(raw),
    warnings: getWarnings(docType, raw),
    raw,
  };
}
