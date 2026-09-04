// src/modules/erp/settings/data-management-types.ts

export type ExportType =
  | "all"
  | "candidates"
  | "agents"
  | "agencies"
  | "medical"
  | "mofa"
  | "visa"
  | "flight";

export type ImportType =
  | "candidates"
  | "agents"
  | "agencies"
  | "medical"
  | "mofa"
  | "visa"
  | "flight";

export type ConflictStrategy = "skip" | "update" | "error";

export type ExportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type ImportJobStatus =
  | "uploaded"
  | "parsing"
  | "validating"
  | "ready"
  | "committing"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExportJob {
  id: string;
  tenant_id: string;
  created_by: string | null;
  status: ExportJobStatus;
  export_type: ExportType;
  format: "xlsx";
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  record_count: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: unknown;
  code: string;
  message: string;
}

export interface ImportNormalizedRow {
  row: number;
  isValid: boolean;
  action: "insert" | "update" | "skip" | "error";
  data: Record<string, unknown>;
  matchId?: string;
}

export interface ImportValidationResult {
  errors: ImportValidationError[];
  rows: ImportNormalizedRow[];
  commitErrors?: { row: number; message: string }[];
}

export interface ImportJob {
  id: string;
  tenant_id: string;
  created_by: string | null;
  status: ImportJobStatus;
  file_path: string;
  file_name: string;
  file_size: number | null;
  import_type: ImportType;
  conflict_strategy: ConflictStrategy;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_count: number;
  validation_result: ImportValidationResult | null;
  created_at: string;
  completed_at: string | null;
  committed_at: string | null;
  error_message: string | null;
}

export interface ExportResult {
  job: ExportJob;
  signedUrl: string;
}

export const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  all: "All",
  candidates: "Candidates",
  agents: "Agents",
  agencies: "Agencies",
  medical: "Medical",
  mofa: "MOFA",
  visa: "Visa",
  flight: "Flight",
};

export const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  candidates: "Candidates",
  agents: "Agents",
  agencies: "Agencies",
  medical: "Medical",
  mofa: "MOFA",
  visa: "Visa",
  flight: "Flight",
};
