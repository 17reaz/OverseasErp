/* =========================================================
   DOCUMENT TEMPLATE SYSTEM — TYPES
   ---------------------------------------------------------
   Shared type contracts for the Document Templates feature
   living inside the Reports module.

   IMPORTANT:
   A Document Template is NOT a Standard Report. Standard
   Report types (report-types.ts) are left untouched — this
   file is intentionally self-contained so nothing here can
   collide with the existing reporting system.
========================================================= */

/* ---------------------------------------------------------
   FIELD SOURCE

   Where a dynamic {{source.key}} token resolves its value
   from. New sources can be added here later (e.g. "visa")
   without touching the renderer/resolver engine.
--------------------------------------------------------- */

export type FieldSource =
  | "candidate"
  | "company"
  | "agent"
  | "contract"
  | "system"

export const FIELD_SOURCE_LABELS: Record<FieldSource, string> = {
  candidate: "Candidate",
  company: "Company",
  agent: "Agent",
  contract: "Contract",
  system: "System",
}

/* ---------------------------------------------------------
   TEMPLATE FIELD DEFINITION

   Describes one dynamic field a template can use. Only
   "contract" (and occasionally "system") fields normally
   need manual entry at generation time — candidate/company/
   agent fields resolve automatically once a candidate is
   selected.
--------------------------------------------------------- */

export type TemplateFieldInputType =
  | "text"
  | "textarea"
  | "number"
  | "date"

export interface TemplateFieldDef {
  id: string // `${source}.${key}` — unique, used as the token name
  source: FieldSource
  key: string
  label: string
  inputType: TemplateFieldInputType
  required?: boolean
  placeholder?: string
}

/* ---------------------------------------------------------
   CONTENT BLOCKS

   The static/dynamic body of a document template. Kept as
   a small, explicit set of block types so both the on-screen
   A4 preview and the PDF renderer can share one resolved
   block list instead of two parallel implementations.
--------------------------------------------------------- */

export type ContentBlock =
  | { id: string; type: "heading"; text: string; align?: "left" | "center" | "right" }
  | { id: string; type: "paragraph"; text: string; align?: "left" | "center" | "right" }
  | { id: string; type: "field-row"; label: string; token: string }
  | { id: string; type: "table"; rows: string[][] }
  | { id: string; type: "signature"; lines: string[] }
  | { id: string; type: "spacer"; height?: number }

/* ---------------------------------------------------------
   TEMPLATE SCHEMA

   The set of manual/contract-level fields the "Use Template"
   screen must render as inputs. Candidate/company/agent
   fields are NOT listed here — they resolve automatically.
--------------------------------------------------------- */

export interface TemplateSchema {
  fields: TemplateFieldDef[]
}

/* ---------------------------------------------------------
   TEMPLATE SETTINGS — layout / paper configuration
--------------------------------------------------------- */

export interface TemplateMargins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface TemplateSettings {
  paperSize: "A4" | "Letter"
  orientation: "portrait" | "landscape"
  margins: TemplateMargins
}

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  paperSize: "A4",
  orientation: "portrait",
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
}

/* ---------------------------------------------------------
   TEMPLATE CATEGORY
--------------------------------------------------------- */

export type TemplateCategory =
  | "employment"
  | "demand_letter"
  | "offer_letter"
  | "guarantee_letter"
  | "salary_certificate"
  | "custom"

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  employment: "Employment",
  demand_letter: "Demand Letter",
  offer_letter: "Offer Letter",
  guarantee_letter: "Guarantee Letter",
  salary_certificate: "Salary Certificate",
  custom: "Custom",
}

/* ---------------------------------------------------------
   TEMPLATE STATUS

   draft  → structure is still editable
   locked → structure is frozen; only usable to generate docs
--------------------------------------------------------- */

export type TemplateStatus = "draft" | "locked"

/* ---------------------------------------------------------
   DOCUMENT TEMPLATE (Supabase `document_templates` row)
--------------------------------------------------------- */

export interface DocumentTemplate {
  id: string
  tenant_id: string
  name: string
  category: TemplateCategory
  description: string | null
  content: ContentBlock[]
  schema: TemplateSchema
  settings: TemplateSettings
  status: TemplateStatus
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentTemplateInput {
  name: string
  category: TemplateCategory
  description?: string | null
  content: ContentBlock[]
  schema: TemplateSchema
  settings: TemplateSettings
}

/* ---------------------------------------------------------
   GENERATED DOCUMENT (Supabase `generated_documents` row)

   A lightweight history record of a document that was
   produced from a template — not the PDF file itself
   (PDFs are generated on the fly, mirroring the existing
   Reports PDF flow), but the field values used to produce
   it, for audit / re-open purposes.
--------------------------------------------------------- */

export interface GeneratedDocument {
  id: string
  tenant_id: string
  template_id: string
  candidate_id: string | null
  document_data: Record<string, string>
  document_number: string | null
  created_by: string | null
  created_at: string
}

export interface GeneratedDocumentInput {
  template_id: string
  candidate_id: string | null
  document_data: Record<string, string>
  document_number: string | null
}

/* ---------------------------------------------------------
   RESOLVED CANDIDATE / COMPANY / AGENT FIELD MAPS

   Plain string maps keyed by field `key` (not `id`), used by
   the data resolver to answer "candidate.full_name" style
   lookups.
--------------------------------------------------------- */

export type FieldValueMap = Record<string, string>

export interface TemplateDataContext {
  candidate: FieldValueMap | null
  company: FieldValueMap | null
  agent: FieldValueMap | null
  contract: FieldValueMap
  system: FieldValueMap
}
