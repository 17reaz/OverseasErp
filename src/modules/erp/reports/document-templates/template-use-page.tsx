import { useEffect, useMemo, useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Download, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/shared/toast/toast"

import { useAuth } from "../../../auth/components/auth-provider"
import type { Agency } from "../../agency/agency-service"
import type { CandidateReference } from "../../candidates/candidate-service"

import { CandidateCombobox } from "./components/candidate-combobox"
import { CompanyCombobox } from "./components/company-combobox"
import { TemplatePreview } from "./components/template-preview"
import {
  buildSystemFields,
  generateDocumentNumber,
  resolveBlocks,
  resolveToken,
} from "./template-data-resolver"
import {
  buildAgentFieldMap,
  buildCandidateFieldMap,
  buildCompanyFieldMap,
  createGeneratedDocument,
  getCandidateExtendedFields,
  getCandidateForTemplate,
  getCandidatesForSelector,
  getCompaniesForSelector,
  getDocumentTemplateById,
} from "./template-service"
import type {
  DocumentTemplate,
  FieldValueMap,
  TemplateDataContext,
} from "./template-types"

function createFileName(templateName: string) {
  return (
    templateName
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() + ".pdf"
  )
}

export function TemplateUsePage() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId: string }>()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)

  const [candidates, setCandidates] = useState<CandidateReference[]>([])
  const [companies, setCompanies] = useState<Agency[]>([])

  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const [candidateFields, setCandidateFields] = useState<FieldValueMap | null>(null)
  const [agentFields, setAgentFields] = useState<FieldValueMap | null>(null)
  const [resolvingCandidate, setResolvingCandidate] = useState(false)

  const [contractValues, setContractValues] = useState<Record<string, string>>({})

  const [documentNumber] = useState(() =>
    generateDocumentNumber(template?.category ?? "doc"),
  )

  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!templateId) {
      return
    }

    let active = true

    async function load() {
      try {
        setLoading(true)

        const [templateData, candidateData, companyData] = await Promise.all([
          getDocumentTemplateById(templateId!),
          getCandidatesForSelector(),
          getCompaniesForSelector(),
        ])

        if (!active) {
          return
        }

        setTemplate(templateData)
        setCandidates(candidateData)
        setCompanies(companyData)
      } catch (err) {
        console.error("Failed to load template usage data:", err)
        toast.error("Failed to load template")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [templateId])

  useEffect(() => {
    if (!candidateId) {
      setCandidateFields(null)
      setAgentFields(null)
      return
    }

    let active = true

    async function resolveCandidate() {
      try {
        setResolvingCandidate(true)

        const [candidate, extended] = await Promise.all([
          getCandidateForTemplate(candidateId!),
          getCandidateExtendedFields(candidateId!),
        ])

        if (!active || !candidate) {
          return
        }

        setCandidateFields(buildCandidateFieldMap(candidate, extended))
        setAgentFields(buildAgentFieldMap(candidate.agent ?? null))
      } catch (err) {
        console.error("Failed to resolve candidate fields:", err)
        toast.error("Failed to load candidate details")
      } finally {
        if (active) {
          setResolvingCandidate(false)
        }
      }
    }

    resolveCandidate()

    return () => {
      active = false
    }
  }, [candidateId])

  const companyFields = useMemo(() => {
    const company = companies.find((c) => String(c.id) === companyId)
    return company ? buildCompanyFieldMap(company) : null
  }, [companies, companyId])

  const context: TemplateDataContext = useMemo(
    () => ({
      candidate: candidateFields,
      company: companyFields,
      agent: agentFields,
      contract: contractValues,
      system: buildSystemFields(documentNumber),
    }),
    [candidateFields, companyFields, agentFields, contractValues, documentNumber],
  )

  const resolver = (token: string) => resolveToken(token, context)

  async function buildPdfBlob() {
    if (!template) {
      return null
    }

    const resolvedBlocks = resolveBlocks(template.content, context)

    const [{ pdf }, { TemplatePdfDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./pdf/template-pdf-document"),
    ])

    return pdf(
      <TemplatePdfDocument
        title={template.name}
        blocks={resolvedBlocks}
        settings={template.settings}
      />,
    ).toBlob()
  }

  async function recordGeneratedDocument() {
    if (!template || !profile) {
      return
    }

    try {
      await createGeneratedDocument(
        {
          template_id: template.id,
          candidate_id: candidateId,
          document_data: {
            ...(candidateFields ?? {}),
            ...(companyFields ?? {}),
            ...contractValues,
          },
          document_number: documentNumber,
        },
        profile.tenant_id,
        profile.id,
      )
    } catch (err) {
      // Non-fatal — the document was still produced either way.
      console.error("Failed to record generated document history:", err)
    }
  }

  async function handleDownload() {
    setIsGenerating(true)

    try {
      const blob = await buildPdfBlob()

      if (!blob || !template) {
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = createFileName(template.name)

      document.body.appendChild(link)
      link.click()
      link.remove()

      setTimeout(() => URL.revokeObjectURL(url), 1000)

      await recordGeneratedDocument()
    } catch (err) {
      console.error("Failed to generate PDF:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handlePrint() {
    setIsGenerating(true)

    try {
      const blob = await buildPdfBlob()

      if (!blob) {
        return
      }

      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank", "noopener,noreferrer")

      if (!printWindow) {
        URL.revokeObjectURL(url)
        return
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000)

      await recordGeneratedDocument()
    } catch (err) {
      console.error("Failed to generate PDF:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading template...
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Template not found.</p>
      </div>
    )
  }

  if (template.status !== "locked") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          This template is still a draft. Lock it in the builder before
          generating documents.
        </p>
      </div>
    )
  }

  const canGenerate = Boolean(candidateId) && !resolvingCandidate

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/app/reports")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>

          <h2 className="text-sm font-semibold">{template.name}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGenerate || isGenerating}
            onClick={handlePrint}
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            Print
          </Button>

          <Button
            size="sm"
            disabled={!canGenerate || isGenerating}
            onClick={handleDownload}
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[340px_1fr]">
        {/* Left: candidate/company + dynamic contract fields */}
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Candidate</Label>
            <CandidateCombobox
              candidates={candidates}
              value={candidateId}
              onChange={setCandidateId}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Company</Label>
            <CompanyCombobox
              companies={companies}
              value={companyId}
              onChange={setCompanyId}
            />
          </div>

          {template.schema.fields.length > 0 ? (
            <>
              <Label className="mt-2">Contract Details</Label>

              {template.schema.fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>

                  {field.inputType === "textarea" ? (
                    <Textarea
                      value={contractValues[field.key] ?? ""}
                      onChange={(e) =>
                        setContractValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={2}
                    />
                  ) : (
                    <Input
                      type={field.inputType === "date" ? "date" : "text"}
                      value={contractValues[field.key] ?? ""}
                      onChange={(e) =>
                        setContractValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </>
          ) : null}
        </div>

        {/* Right: A4 live preview */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30 p-6">
          <div className="mx-auto w-fit shadow-lg">
            <TemplatePreview blocks={template.content} resolver={resolver} />
          </div>
        </div>
      </div>
    </div>
  )
}
