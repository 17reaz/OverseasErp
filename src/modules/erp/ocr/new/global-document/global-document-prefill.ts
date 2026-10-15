
import type { GlobalDocumentType } from "./global-document-service";

export type GlobalDocumentPrefill = {
  docType: GlobalDocumentType;
  data: Record<string, unknown>;
  file: File;
};

let pendingPrefill: GlobalDocumentPrefill | null = null;

export function setGlobalDocumentPrefill(
  draft: GlobalDocumentPrefill,
) {
  pendingPrefill = draft;
}

export function consumeGlobalDocumentPrefill():
  | GlobalDocumentPrefill
  | null {
  const draft = pendingPrefill;
  pendingPrefill = null;
  return draft;
}
