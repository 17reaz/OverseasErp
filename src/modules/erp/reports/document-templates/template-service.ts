import { supabase } from "@/lib/supabase/client"

import {
  getCandidateById,
  getCandidateReferences,
  type Candidate,
  type CandidateReference,
} from "../../candidates/candidate-service"

import {
  getAgencies,
  type Agency,
} from "../../agency/agency-service"

import {
  getAgents,
} from "../../agents/agents-service"

import type { Agent } from "../../agents/types"

import type {
  DocumentTemplate,
  DocumentTemplateInput,
  FieldValueMap,
  GeneratedDocument,
  GeneratedDocumentInput,
  TemplateStatus,
} from "./template-types"

/* =========================================================
   DOCUMENT TEMPLATES — CRUD

   Reuses the existing `supabase` client and relies on Row
   Level Security (see the accompanying migration) to scope
   every read/write to the caller's tenant — exactly like
   every other service in this project.
========================================================= */

const DOCUMENT_TEMPLATE_SELECT = `
  id,
  tenant_id,
  name,
  category,
  description,
  content,
  schema,
  settings,
  status,
  is_active,
  created_by,
  created_at,
  updated_at
`

export async function listDocumentTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from("document_templates")
    .select(DOCUMENT_TEMPLATE_SELECT)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as DocumentTemplate[]
}

export async function getDocumentTemplateById(
  id: string,
): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase
    .from("document_templates")
    .select(DOCUMENT_TEMPLATE_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as unknown as DocumentTemplate | null
}

export async function createDocumentTemplate(
  input: DocumentTemplateInput,
  tenantId: string,
  userId: string,
): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from("document_templates")
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      content: input.content,
      schema: input.schema,
      settings: input.settings,
      status: "draft",
      is_active: true,
    })
    .select(DOCUMENT_TEMPLATE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as DocumentTemplate
}

export async function updateDocumentTemplate(
  id: string,
  input: Partial<DocumentTemplateInput>,
): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from("document_templates")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_TEMPLATE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as DocumentTemplate
}

export async function setDocumentTemplateStatus(
  id: string,
  status: TemplateStatus,
): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from("document_templates")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(DOCUMENT_TEMPLATE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as DocumentTemplate
}

export async function setDocumentTemplateActive(
  id: string,
  isActive: boolean,
): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from("document_templates")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(DOCUMENT_TEMPLATE_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as DocumentTemplate
}

export async function deleteDocumentTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("document_templates")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}

/* =========================================================
   GENERATED DOCUMENTS — history
========================================================= */

export async function createGeneratedDocument(
  input: GeneratedDocumentInput,
  tenantId: string,
  userId: string,
): Promise<GeneratedDocument> {
  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      template_id: input.template_id,
      candidate_id: input.candidate_id,
      document_data: input.document_data,
      document_number: input.document_number,
    })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return data as unknown as GeneratedDocument
}

export async function listGeneratedDocuments(
  templateId: string,
): Promise<GeneratedDocument[]> {
  const { data, error } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("template_id", templateId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as GeneratedDocument[]
}

/* =========================================================
   DATA SOURCES FOR THE "USE TEMPLATE" SCREEN

   Reuses existing candidate/agency/agent services wherever
   possible. Candidate fields that don't exist on the shared
   Candidate contract yet (nationality, profession, date of
   birth, address, phone) are fetched with a small dedicated
   query below instead of touching candidate-service.ts /
   candidate-types.ts, so the existing Candidate module is
   left completely untouched.
========================================================= */

export interface CandidateExtendedFields {
  nationality: string | null
  profession: string | null
  date_of_birth: string | null
  address: string | null
  phone: string | null
}

export async function getCandidatesForSelector(): Promise<CandidateReference[]> {
  return getCandidateReferences()
}

export async function getCandidateForTemplate(
  candidateId: string,
): Promise<Candidate | null> {
  return getCandidateById(candidateId)
}

export async function getCandidateExtendedFields(
  candidateId: string,
): Promise<CandidateExtendedFields> {
  const { data, error } = await supabase
    .from("candidates")
    .select("nationality, profession, date_of_birth, address, phone")
    .eq("id", candidateId)
    .maybeSingle()

  if (error) {
    // These columns are additive — if the migration hasn't
    // been applied yet, degrade gracefully instead of
    // breaking document generation.
    console.error("Failed to load extended candidate fields:", error)

    return {
      nationality: null,
      profession: null,
      date_of_birth: null,
      address: null,
      phone: null,
    }
  }

  return (data ?? {
    nationality: null,
    profession: null,
    date_of_birth: null,
    address: null,
    phone: null,
  }) as CandidateExtendedFields
}

export async function getCompaniesForSelector(): Promise<Agency[]> {
  return getAgencies()
}

export async function getAgentsForSelector(): Promise<Agent[]> {
  return getAgents()
}

/* =========================================================
   FIELD MAP BUILDERS

   Converts real records into the plain FieldValueMap shape
   the pure resolver (template-data-resolver.ts) understands.
========================================================= */

export function buildCandidateFieldMap(
  candidate: Candidate,
  extended: CandidateExtendedFields,
): FieldValueMap {
  return {
    full_name: candidate.name ?? "",
    passport_no: candidate.passport_no ?? "",
    country: candidate.country ?? "",
    nationality: extended.nationality ?? "",
    profession: extended.profession ?? "",
    date_of_birth: extended.date_of_birth ?? "",
    address: extended.address ?? "",
    phone: extended.phone ?? "",
  }
}

export function buildCompanyFieldMap(company: Agency): FieldValueMap {
  return {
    name: company.name ?? "",
    code: company.code ?? "",
    address: company.address ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
  }
}

export function buildAgentFieldMap(
  agent: { name: string | null; code: string | null } | null,
): FieldValueMap {
  if (!agent) {
    return { name: "", code: "" }
  }

  return {
    name: agent.name ?? "",
    code: agent.code ?? "",
  }
}
