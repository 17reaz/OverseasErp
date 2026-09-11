import type {
  FieldSource,
  TemplateFieldInputType,
} from "./template-types"

/* =========================================================
   FIELD REGISTRY
   ---------------------------------------------------------
   The single reusable catalog of every dynamic field the
   Document Template Builder can offer for insertion, grouped
   by source (candidate / company / agent / contract / system).

   This is display/authoring metadata only — it does NOT
   decide how a value resolves at generation time (see
   template-data-resolver.ts) and it is NOT the list of
   fields a specific template uses (see TemplateSchema).

   Adding a future field (e.g. candidate.religion) means
   adding one entry here — no other file needs to change.
========================================================= */

export interface RegistryField {
  key: string
  label: string
  inputType: TemplateFieldInputType
  /**
   * True when this field is resolved automatically from an
   * existing record (candidate/company/agent) once selected.
   * False means the value must be entered manually per
   * generated document (typically "contract" fields, since
   * they are not stored anywhere else).
   */
  autoResolved: boolean
}

export interface FieldSourceGroup {
  source: FieldSource
  label: string
  description: string
  fields: RegistryField[]
}

export const FIELD_REGISTRY: FieldSourceGroup[] = [
  {
    source: "candidate",
    label: "Candidate",
    description: "Resolved automatically from the selected candidate.",
    fields: [
      { key: "full_name", label: "Full Name", inputType: "text", autoResolved: true },
      { key: "passport_no", label: "Passport No.", inputType: "text", autoResolved: true },
      { key: "nationality", label: "Nationality", inputType: "text", autoResolved: true },
      { key: "profession", label: "Profession", inputType: "text", autoResolved: true },
      { key: "date_of_birth", label: "Date of Birth", inputType: "date", autoResolved: true },
      { key: "address", label: "Address", inputType: "text", autoResolved: true },
      { key: "phone", label: "Phone", inputType: "text", autoResolved: true },
      { key: "country", label: "Country", inputType: "text", autoResolved: true },
    ],
  },
  {
    source: "company",
    label: "Company",
    description: "Resolved automatically from the selected company.",
    fields: [
      { key: "name", label: "Name", inputType: "text", autoResolved: true },
      { key: "code", label: "Code", inputType: "text", autoResolved: true },
      { key: "address", label: "Address", inputType: "text", autoResolved: true },
      { key: "phone", label: "Phone", inputType: "text", autoResolved: true },
      { key: "email", label: "Email", inputType: "text", autoResolved: true },
    ],
  },
  {
    source: "agent",
    label: "Agent",
    description: "Resolved automatically from the candidate's linked agent.",
    fields: [
      { key: "name", label: "Name", inputType: "text", autoResolved: true },
      { key: "code", label: "Code", inputType: "text", autoResolved: true },
    ],
  },
  {
    source: "contract",
    label: "Contract",
    description: "Entered manually for each generated document.",
    fields: [
      { key: "salary", label: "Monthly Salary", inputType: "text", autoResolved: false },
      { key: "duration", label: "Contract Duration", inputType: "text", autoResolved: false },
      { key: "working_hours", label: "Working Hours / Day", inputType: "text", autoResolved: false },
      { key: "accommodation", label: "Accommodation", inputType: "text", autoResolved: false },
      { key: "transportation", label: "Transportation", inputType: "text", autoResolved: false },
      { key: "medical", label: "Medical Coverage", inputType: "text", autoResolved: false },
      { key: "ticket", label: "Return Air Ticket", inputType: "text", autoResolved: false },
      { key: "leave_terms", label: "Leave / Terms", inputType: "textarea", autoResolved: false },
    ],
  },
  {
    source: "system",
    label: "System",
    description: "Resolved automatically at generation time.",
    fields: [
      { key: "current_date", label: "Current Date", inputType: "date", autoResolved: true },
      { key: "generated_date", label: "Generated Date", inputType: "date", autoResolved: true },
      { key: "document_number", label: "Document Number", inputType: "text", autoResolved: true },
    ],
  },
]

export function getRegistryField(
  source: FieldSource,
  key: string,
): RegistryField | undefined {
  return FIELD_REGISTRY.find((g) => g.source === source)?.fields.find(
    (f) => f.key === key,
  )
}

export function tokenFor(source: FieldSource, key: string): string {
  return `{{${source}.${key}}}`
}
