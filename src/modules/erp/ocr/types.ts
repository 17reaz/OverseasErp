export type DocType =
  | "passport"
  | "visa"
  | "mofa"
  | "nid"
  | "medical"
  | "police_clearance";

export type ScanStatus = "processing" | "needs_review" | "approved" | "failed";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  /** 0 - 100 */
  confidence: number;
}

export interface OcrScan {
  id: string;
  fileName: string;
  docType: DocType;
  status: ScanStatus;
  /** average confidence, 0 - 100 */
  confidence: number;
  candidateName: string | null;
  uploadedBy: string;
  createdAt: string; // ISO
  pages: number;
  fields: ExtractedField[];
  error?: string;
}
