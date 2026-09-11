import type {
  ContentBlock,
  DocumentTemplateInput,
} from "./template-types"

/* =========================================================
   SAUDI EMPLOYMENT CONTRACT — STARTER CONTENT
   ---------------------------------------------------------
   The first real Document Template. This is only a starter
   payload used to pre-fill the Template Builder when an
   admin creates a new template — it is NOT auto-inserted
   into the database by a migration, since tenant_id/created_by
   must belong to a real tenant/user.

   Legal/static text stays static; every piece of information
   that comes from a candidate, company, or the contract terms
   is a `{{source.key}}` token, resolved at generation time by
   template-data-resolver.ts.
========================================================= */

let idCounter = 0

function blockId() {
  idCounter += 1
  return `seed-${idCounter}`
}

export function buildSaudiEmploymentContractContent(): ContentBlock[] {
  return [
    { id: blockId(), type: "heading", text: "EMPLOYMENT CONTRACT", align: "center" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "This Employment Contract (\"Agreement\") is made and entered into by and between the following parties, in accordance with the Labor Law of the Kingdom of Saudi Arabia:",
    },

    { id: blockId(), type: "field-row", label: "Party 1 (Employer)", token: "{{company.name}}" },
    { id: blockId(), type: "field-row", label: "Address", token: "{{company.address}}" },
    { id: blockId(), type: "field-row", label: "Phone", token: "{{company.phone}}" },

    { id: blockId(), type: "spacer", height: 8 },

    { id: blockId(), type: "field-row", label: "Party 2 (Employee)", token: "{{candidate.full_name}}" },
    { id: blockId(), type: "field-row", label: "Passport No.", token: "{{candidate.passport_no}}" },
    { id: blockId(), type: "field-row", label: "Nationality", token: "{{candidate.nationality}}" },
    { id: blockId(), type: "field-row", label: "Date of Birth", token: "{{candidate.date_of_birth}}" },
    { id: blockId(), type: "field-row", label: "Profession", token: "{{candidate.profession}}" },

    {
      id: blockId(),
      type: "paragraph",
      text: "Whereby both parties agree, of their own free will, to the following terms and conditions:",
    },

    { id: blockId(), type: "heading", text: "1. Job Title & Duties" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employee is engaged to work as {{candidate.profession}} and shall perform all duties assigned by the Employer in accordance with the laws of the Kingdom of Saudi Arabia.",
    },

    { id: blockId(), type: "heading", text: "2. Contract Duration" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "This contract shall be valid for a period of {{contract.duration}}, commencing from the date the Employee arrives in the Kingdom of Saudi Arabia, renewable by mutual consent of both parties.",
    },

    { id: blockId(), type: "heading", text: "3. Working Hours" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employee shall work {{contract.working_hours}} hours per day, six days per week, in accordance with Saudi Labor Law, with one paid weekly rest day.",
    },

    { id: blockId(), type: "heading", text: "4. Remuneration" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employer shall pay the Employee a monthly salary of {{contract.salary}}, payable at the end of each Gregorian month.",
    },

    { id: blockId(), type: "heading", text: "5. Accommodation & Transportation" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employer shall provide the Employee with {{contract.accommodation}} and {{contract.transportation}}, in accordance with Saudi Labor Law.",
    },

    { id: blockId(), type: "heading", text: "6. Medical Care" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employer shall provide the Employee with {{contract.medical}} medical insurance coverage, in accordance with Saudi Labor Law.",
    },

    { id: blockId(), type: "heading", text: "7. Return Air Ticket" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "The Employer shall bear the cost of {{contract.ticket}} between the Employee's home country and the Kingdom of Saudi Arabia.",
    },

    { id: blockId(), type: "heading", text: "8. Leave & Termination" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "{{contract.leave_terms}} Either party may otherwise terminate this contract in accordance with the terms provided by Saudi Labor Law.",
    },

    { id: blockId(), type: "heading", text: "9. Governing Law" },
    {
      id: blockId(),
      type: "paragraph",
      text:
        "This contract shall be governed by and construed in accordance with the Labor Law of the Kingdom of Saudi Arabia. Any dispute arising from this contract shall be settled through the competent Saudi labor authorities.",
    },

    { id: blockId(), type: "spacer", height: 24 },

    {
      id: blockId(),
      type: "signature",
      lines: [
        "Party 1 (Employer) Signature: ______________________",
        "Party 2 (Employee) Signature: ______________________",
        "Date: {{system.current_date}}        Document No: {{system.document_number}}",
      ],
    },
  ]
}

/**
 * The manual/contract-level fields this template needs. These
 * are the only inputs the "Use Template" screen has to render
 * — candidate/company/agent fields resolve automatically.
 */
export function buildSaudiEmploymentContractSchema() {
  return {
    fields: [
      { id: "contract.salary", source: "contract" as const, key: "salary", label: "Monthly Salary", inputType: "text" as const, required: true, placeholder: "e.g. 1200 + 200 SR" },
      { id: "contract.duration", source: "contract" as const, key: "duration", label: "Contract Duration", inputType: "text" as const, required: true, placeholder: "e.g. 02 Years" },
      { id: "contract.working_hours", source: "contract" as const, key: "working_hours", label: "Working Hours / Day", inputType: "text" as const, required: true, placeholder: "e.g. 10" },
      { id: "contract.accommodation", source: "contract" as const, key: "accommodation", label: "Accommodation", inputType: "text" as const, placeholder: "e.g. free accommodation" },
      { id: "contract.transportation", source: "contract" as const, key: "transportation", label: "Transportation", inputType: "text" as const, placeholder: "e.g. free transportation" },
      { id: "contract.medical", source: "contract" as const, key: "medical", label: "Medical Coverage", inputType: "text" as const, placeholder: "e.g. full" },
      { id: "contract.ticket", source: "contract" as const, key: "ticket", label: "Return Air Ticket", inputType: "text" as const, placeholder: "e.g. round-trip air ticket" },
      { id: "contract.leave_terms", source: "contract" as const, key: "leave_terms", label: "Leave / Terms", inputType: "textarea" as const, placeholder: "e.g. 30 days paid annual leave after 1 year of service." },
    ],
  }
}

export function buildSaudiEmploymentContractSeed(): DocumentTemplateInput {
  return {
    name: "Saudi Employment Contract",
    category: "employment",
    description: "Standard Saudi Arabia employment contract for outbound candidates.",
    content: buildSaudiEmploymentContractContent(),
    schema: buildSaudiEmploymentContractSchema(),
    settings: {
      paperSize: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
  }
}
