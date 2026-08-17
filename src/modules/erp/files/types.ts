export type DocumentType =
  | "passport"
  | "photo"
  | "medical"
  | "mofa"
  | "visa"
  | "contract"
  | "other";

export interface FileRecord {
  id: number;

  tenant_id: string;

  candidate_id: string | null;

  doc_type: DocumentType;

  file_location: string;

  version: number;

  is_active: boolean;

  created_at: string;

  updated_at: string;
}