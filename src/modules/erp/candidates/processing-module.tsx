import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

import {
  Link,
  useParams,
} from "react-router-dom"

import { QRCodeSVG } from "qrcode.react"

import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Fingerprint,
  FolderOpen,
  IdCard,
  Pencil,
  Plane,
  Plus,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { toast } from "@/components/shared/toast/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAuth } from "@/modules/auth/components/auth-provider"
import { supabase } from "@/lib/supabase/client"

import { UniversalSheet } from "@/modules/erp/shared/forms/universal-sheet"
import { CandidateFormDialog } from "./components/candidate-form-dialog"

import {
  getCandidate,
  type Candidate,
} from "./candidate-service"


/* =========================================================
 * MODULE STATUS
 * ========================================================= */

type ModuleStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "not_started"

type FieldValues = Record<string, string | boolean>

interface ModuleField {
  key: string
  label: string
  type: "text" | "date" | "select" | "switch"
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  showIf?: (values: FieldValues) => boolean
}

interface ModuleConfig {
  key: string
  title: string
  description: string
  icon: ReactNode
  table: string
  statusSelect: string
  href: (candidateId: string) => string
  fields: ModuleField[]
  defaultValues: () => FieldValues
  buildPayload: (
    values: FieldValues,
    candidateId: string,
    tenantId: string,
  ) => Record<string, unknown>
  mapStatus: (row: Record<string, unknown> | null) => ModuleStatus
}


/* =========================================================
 * STATUS CONFIG (display)
 * ========================================================= */

function getStatusConfig(status: ModuleStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        variant: "default" as const,
        icon: CheckCircle2,
        dot: "bg-primary border-primary text-primary-foreground",
        line: "bg-primary",
      }

    case "processing":
      return {
        label: "Processing",
        variant: "secondary" as const,
        icon: Clock3,
        dot: "bg-blue-500 border-blue-500 text-white",
        line: "bg-blue-500/60",
      }

    case "failed":
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
        dot: "bg-destructive border-destructive text-destructive-foreground",
        line: "bg-destructive/50",
      }

    case "pending":
      return {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock3,
        dot: "bg-background border-muted-foreground/40 text-muted-foreground",
        line: "bg-border",
      }

    default:
      return {
        label: "Not Started",
        variant: "outline" as const,
        icon: Clock3,
        dot: "bg-muted border-border text-muted-foreground",
        line: "bg-border",
      }
  }
}


/* =========================================================
 * MODULE DEFINITIONS
 *
 * Single source of truth for every processing module shown
 * on the candidate profile. Adding a new module to the ERP
 * only requires a new entry here — the status badge and the
 * quick-add sheet are both generated from this config.
 * ========================================================= */

const MODULES: ModuleConfig[] = [
  {
    key: "medical",
    title: "Medical",
    description: "Medical examination and fitness records.",
    icon: <Stethoscope className="h-4 w-4" />,
    table: "medicals",
    statusSelect: "status, created_at",
    href: (id) => `/app/medical?candidate=${id}`,
    fields: [
      {
        key: "medical_date",
        label: "Medical Date",
        type: "date",
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "new", label: "New" },
          { value: "fit", label: "Fit" },
          { value: "unfit", label: "Unfit" },
          { value: "expired", label: "Expired" },
        ],
      },
    ],
    defaultValues: () => ({
      medical_date: "",
      status: "new",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      medical_date: v.medical_date || null,
      status: v.status,
      fit_date: v.status === "fit" ? v.medical_date || null : null,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      switch (row.status) {
        case "fit":
          return "completed"
        case "unfit":
        case "expired":
          return "failed"
        default:
          return "pending"
      }
    },
  },

  {
    key: "police_clearance",
    title: "Police Clearance",
    description: "Police clearance verification records.",
    icon: <ShieldCheck className="h-4 w-4" />,
    table: "police_clearances",
    statusSelect: "verified, created_at",
    href: (id) => `/app/police-clearance?candidate=${id}`,
    fields: [
      {
        key: "received_date",
        label: "Received Date",
        type: "date",
      },
      {
        key: "verified",
        label: "Verified",
        type: "switch",
      },
      {
        key: "verified_date",
        label: "Verified Date",
        type: "date",
        showIf: (v) => v.verified === true,
      },
    ],
    defaultValues: () => ({
      received_date: "",
      verified: false,
      verified_date: "",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      received_date: v.received_date || null,
      verified: !!v.verified,
      verified_date: v.verified ? v.verified_date || null : null,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"
      return row.verified ? "completed" : "pending"
    },
  },

  {
    key: "finger",
    title: "Finger",
    description: "Fingerprint registration and records.",
    icon: <Fingerprint className="h-4 w-4" />,
    table: "fingers",
    statusSelect: "status, created_at",
    href: (id) => `/app/fingers?candidate=${id}`,
    fields: [
      {
        key: "finger_date",
        label: "Finger Date",
        type: "date",
      },
      {
        key: "finger_type",
        label: "Finger Type",
        type: "select",
        options: [
          { value: "fresh", label: "Fresh" },
          { value: "existing", label: "Existing" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "pending", label: "Pending" },
          { value: "scheduled", label: "Scheduled" },
          { value: "completed", label: "Completed" },
          { value: "failed", label: "Failed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
    ],
    defaultValues: () => ({
      finger_date: "",
      finger_type: "fresh",
      status: "pending",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      finger_date: v.finger_date || null,
      finger_type: v.finger_type,
      status: v.status,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      switch (row.status) {
        case "completed":
          return "completed"
        case "scheduled":
          return "processing"
        case "failed":
        case "cancelled":
          return "failed"
        default:
          return "pending"
      }
    },
  },

  {
    key: "mofa",
    title: "MOFA",
    description: "Ministry approval and application processing.",
    icon: <FileText className="h-4 w-4" />,
    table: "mofas",
    statusSelect: "stage, created_at",
    href: (id) => `/app/mofa?candidate=${id}`,
    fields: [
      {
        key: "application_number",
        label: "Application Number",
        type: "text",
        required: true,
      },
      {
        key: "application_date",
        label: "Application Date",
        type: "date",
        required: true,
      },
      {
        key: "trade",
        label: "Trade",
        type: "text",
        required: true,
      },
      {
        key: "stage",
        label: "Stage",
        type: "select",
        options: [
          { value: "new", label: "New" },
          { value: "medupdated", label: "Medical Updated" },
          { value: "approved", label: "Approved" },
          { value: "canceled", label: "Canceled" },
          { value: "expired", label: "Expired" },
          { value: "invalid", label: "Invalid" },
        ],
      },
    ],
    defaultValues: () => ({
      application_number: "",
      application_date: "",
      trade: "",
      stage: "new",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      application_number: v.application_number,
      application_date: v.application_date || null,
      trade: v.trade,
      stage: v.stage,
      medical_id: null,
      agency_id: null,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      switch (row.stage) {
        case "approved":
          return "completed"
        case "canceled":
        case "expired":
        case "invalid":
          return "failed"
        default:
          return "processing"
      }
    },
  },

  {
    key: "takamul",
    title: "Takamul",
    description: "Trade test scheduling and results.",
    icon: <Award className="h-4 w-4" />,
    table: "trade_tests",
    statusSelect: "status, result, created_at",
    href: (id) => `/app/takamul?candidate=${id}`,
    fields: [
      {
        key: "test_center",
        label: "Test Center",
        type: "text",
        required: true,
      },
      {
        key: "test_date",
        label: "Test Date",
        type: "date",
      },
      {
        key: "result",
        label: "Result",
        type: "select",
        options: [
          { value: "pending", label: "Pending" },
          { value: "pass", label: "Pass" },
          { value: "fail", label: "Fail" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "scheduled", label: "Scheduled" },
          { value: "completed", label: "Completed" },
          { value: "expired", label: "Expired" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
    ],
    defaultValues: () => ({
      test_center: "",
      test_date: "",
      result: "pending",
      status: "scheduled",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      test_center: v.test_center,
      test_date: v.test_date || null,
      result: v.result,
      status: v.status,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      if (row.status === "completed") {
        return row.result === "fail" ? "failed" : "completed"
      }

      switch (row.status) {
        case "scheduled":
          return "processing"
        case "expired":
        case "cancelled":
          return "failed"
        default:
          return "pending"
      }
    },
  },

  {
    key: "visa",
    title: "Visa",
    description: "Visa application and processing records.",
    icon: <IdCard className="h-4 w-4" />,
    table: "visas",
    statusSelect: "status, created_at",
    href: (id) => `/app/visa?candidate=${id}`,
    fields: [
      {
        key: "visa_no",
        label: "Visa Number",
        type: "text",
        required: true,
      },
      {
        key: "visa_date",
        label: "Visa Date",
        type: "date",
      },
      {
        key: "expiry_date",
        label: "Expiry Date",
        type: "date",
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        placeholder: "e.g. issued, pending, rejected",
      },
    ],
    defaultValues: () => ({
      visa_no: "",
      visa_date: "",
      expiry_date: "",
      status: "",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      visa_no: v.visa_no,
      visa_date: v.visa_date || null,
      expiry_date: v.expiry_date || null,
      status: v.status || null,
      mofa_id: null,
      agency_id: null,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      const status = String(row.status ?? "").toLowerCase()

      if (!status) return "processing"

      if (/(issued|approved|active)/.test(status)) return "completed"
      if (/(reject|cancel|expired|denied)/.test(status)) return "failed"

      return "processing"
    },
  },

  {
    key: "flight",
    title: "Flight",
    description: "Flight booking and travel information.",
    icon: <Plane className="h-4 w-4" />,
    table: "flights",
    statusSelect: "status, created_at",
    href: (id) => `/app/flight?candidate=${id}`,
    fields: [
      {
        key: "flight_date",
        label: "Flight Date",
        type: "date",
      },
      {
        key: "flight_no",
        label: "Flight Number",
        type: "text",
      },
      {
        key: "airline",
        label: "Airline",
        type: "text",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "scheduled", label: "Scheduled" },
          { value: "departed", label: "Departed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "rescheduled", label: "Rescheduled" },
        ],
      },
    ],
    defaultValues: () => ({
      flight_date: "",
      flight_no: "",
      airline: "",
      status: "scheduled",
    }),
    buildPayload: (v, candidateId, tenantId) => ({
      tenant_id: tenantId,
      candidate_id: candidateId,
      flight_date: v.flight_date || null,
      flight_no: v.flight_no || null,
      airline: v.airline || null,
      status: v.status,
      visa_id: null,
    }),
    mapStatus: (row) => {
      if (!row) return "not_started"

      switch (row.status) {
        case "departed":
          return "completed"
        case "cancelled":
          return "failed"
        case "rescheduled":
          return "pending"
        default:
          return "processing"
      }
    },
  },
]


/* =========================================================
 * MODULE STATUS FETCHING
 * ========================================================= */

async function fetchModuleStatuses(
  candidateId: string,
): Promise<Record<string, ModuleStatus>> {
  const entries = await Promise.all(
    MODULES.map(async (module) => {
      const { data, error } = await supabase
        .from(module.table)
        .select(module.statusSelect)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error(`Failed to load ${module.table} status`, error)
        return [module.key, "not_started" as ModuleStatus] as const
      }

      return [
        module.key,
        module.mapStatus(data as Record<string, unknown> | null),
      ] as const
    }),
  )

  return Object.fromEntries(entries)
}

async function fetchDocumentsStatus(
  candidateId: string,
): Promise<ModuleStatus> {
  const { count, error } = await supabase
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .eq("is_active", true)

  if (error) {
    console.error("Failed to load documents status", error)
    return "not_started"
  }

  return (count ?? 0) > 0 ? "completed" : "not_started"
}


/* =========================================================
 * MODULE QUICK-ADD SHEET
 *
 * One generic sheet, driven by ModuleConfig, so every
 * module gets the exact same add-record experience instead
 * of each module reimplementing its own form/sheet pattern.
 * ========================================================= */

function ModuleQuickAddSheet({
  module,
  candidateId,
  tenantId,
  open,
  onOpenChange,
  onSuccess,
}: {
  module: ModuleConfig
  candidateId: string
  tenantId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [values, setValues] = useState<FieldValues>(
    module.defaultValues(),
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(module.defaultValues())
    }
  }, [open, module])

  function setField(key: string, value: string | boolean) {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!tenantId) {
      toast.error(
        "Missing tenant information.",
        "Please refresh the page and try again.",
      )
      return
    }

    for (const field of module.fields) {
      const visible = field.showIf ? field.showIf(values) : true

      if (field.required && visible && !values[field.key]) {
        toast.error(
          `${field.label} is required.`,
          `Please fill in ${field.label.toLowerCase()} before saving.`,
        )
        return
      }
    }

    setLoading(true)

    try {
      const payload = module.buildPayload(
        values,
        candidateId,
        tenantId,
      )

      const { error } = await supabase
        .from(module.table)
        .insert(payload)

      if (error) throw error

      toast.success(
        `${module.title} record added.`,
        `A new ${module.title.toLowerCase()} record has been created for this candidate.`,
      )

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error(error)

      toast.error(
        `Failed to add ${module.title.toLowerCase()} record.`,
        "Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <UniversalSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Add ${module.title} Record`}
      description={`Create a new ${module.title.toLowerCase()} record for this candidate.`}
      onSubmit={handleSubmit}
      submitLabel="Add Record"
      loading={loading}
      hasChanges
    >
      <div className="space-y-4">
        {module.fields.map((field) => {
          if (field.showIf && !field.showIf(values)) {
            return null
          }

          const inputId = `${module.key}-${field.key}`

          return (
            <div
              key={field.key}
              className="space-y-1.5"
            >
              <Label htmlFor={inputId}>
                {field.label}
                {field.required && " *"}
              </Label>

              {field.type === "text" && (
                <Input
                  id={inputId}
                  value={String(values[field.key] ?? "")}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setField(field.key, event.target.value)
                  }
                />
              )}

              {field.type === "date" && (
                <Input
                  id={inputId}
                  type="date"
                  value={String(values[field.key] ?? "")}
                  onChange={(event) =>
                    setField(field.key, event.target.value)
                  }
                />
              )}

              {field.type === "select" && (
                <Select
                  value={String(values[field.key] ?? "")}
                  onValueChange={(value) =>
                    setField(field.key, value)
                  }
                >
                  <SelectTrigger id={inputId}>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "switch" && (
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id={inputId}
                    checked={!!values[field.key]}
                    onCheckedChange={(checked) =>
                      setField(field.key, checked)
                    }
                  />

                  <span className="text-sm text-muted-foreground">
                    {values[field.key] ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </UniversalSheet>
  )
}


/* =========================================================
 * PROCESSING STEPPER (horizontal)
 *
 * Same data + same actions as before (Add Record / View
 * All), just laid out as a horizontal step sequence instead
 * of a card grid. Each node is the status dot + icon; the
 * connecting line between nodes tints with the earlier
 * step's status so progress reads left → right at a glance.
 * ========================================================= */

function StepperNode({
  module,
  status,
  href,
  onAdd,
  isLast,
}: {
  module: ModuleConfig
  status: ModuleStatus
  href: string
  onAdd: () => void
  isLast: boolean
}) {
  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  return (
    <div className="flex flex-1 items-start">
      <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onAdd}
                className={cn(
                  "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                  config.dot,
                )}
              >
                {module.icon}

                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background",
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "h-3 w-3",
                      status === "completed" && "text-primary",
                      status === "processing" && "text-blue-500",
                      status === "failed" && "text-destructive",
                      (status === "pending" || status === "not_started") &&
                        "text-muted-foreground",
                    )}
                  />
                </span>

                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 opacity-0 transition-opacity group-hover:bg-foreground/10 group-hover:opacity-100">
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </TooltipTrigger>

            <TooltipContent>
              <p className="text-xs">Add {module.title.toLowerCase()} record</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="space-y-0.5">
          <p className="text-xs font-medium leading-tight">
            {module.title}
          </p>

          <Badge
            variant={config.variant}
            className="text-[10px] font-normal"
          >
            {config.label}
          </Badge>
        </div>

        <Link
          to={href}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </div>

      {!isLast && (
        <div
          className={cn(
            "mt-[22px] h-0.5 flex-1 min-w-[24px] rounded-full transition-colors",
            config.line,
          )}
        />
      )}
    </div>
  )
}

function DocumentsStepNode({
  status,
  href,
}: {
  status: ModuleStatus
  href: string
}) {
  const config = getStatusConfig(status)

  return (
    <div className="flex min-w-[92px] flex-col items-center gap-2 text-center">
      <Link
        to={href}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
          config.dot,
        )}
      >
        <FolderOpen className="h-4 w-4" />
      </Link>

      <div className="space-y-0.5">
        <p className="text-xs font-medium leading-tight">Documents</p>

        <Badge
          variant={config.variant}
          className="text-[10px] font-normal"
        >
          {config.label}
        </Badge>
      </div>

      <Link
        to={href}
        className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Open
      </Link>
    </div>
  )
}

function ProcessingStepper({
  moduleStatuses,
  documentsStatus,
  candidateId,
  onAdd,
}: {
  moduleStatuses: Record<string, ModuleStatus>
  documentsStatus: ModuleStatus
  candidateId: string
  onAdd: (moduleKey: string) => void
}) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max items-start gap-1 px-1 sm:min-w-full">
        {MODULES.map((module) => (
          <StepperNode
            key={module.key}
            module={module}
            href={module.href(candidateId)}
            status={moduleStatuses[module.key] ?? "not_started"}
            onAdd={() => onAdd(module.key)}
            isLast={false}
          />
        ))}

        <DocumentsStepNode
          status={documentsStatus}
          href={`/app/files?candidate=${candidateId}`}
        />
      </div>
    </div>
  )
}


/* =========================================================
 * INFORMATION ITEM
 * ========================================================= */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
        {icon}
        {value}
      </p>
    </div>
  )
}


/* =========================================================
 * PAGE
 * ========================================================= */

export function CandidateProfilePage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const { profile } = useAuth()

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [moduleStatuses, setModuleStatuses] = useState<
    Record<string, ModuleStatus>
  >({})

  const [documentsStatus, setDocumentsStatus] =
    useState<ModuleStatus>("not_started")

  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(
    null,
  )

  const [editOpen, setEditOpen] = useState(false)


  /* =======================================================
   * LOAD CANDIDATE + MODULE STATUSES
   * ======================================================= */

  const loadCandidate = useCallback(async () => {
    if (!candidateId) {
      const message = "Candidate ID is missing."

      setError(message)
      setLoading(false)

      toast.error(
        "Candidate ID is missing.",
        "Please return to the Candidates page and select a candidate.",
      )

      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await getCandidate(candidateId)

      if (error) throw error

      if (!data) {
        const message = "Candidate not found."

        setError(message)

        toast.error(
          "Candidate not found.",
          "The requested candidate profile could not be found.",
        )

        return
      }

      setCandidate(data)

      const [statuses, docsStatus] = await Promise.all([
        fetchModuleStatuses(candidateId),
        fetchDocumentsStatus(candidateId),
      ])

      setModuleStatuses(statuses)
      setDocumentsStatus(docsStatus)
    } catch (error) {
      console.error(error)

      const message = "Failed to load candidate profile."

      setError(message)

      toast.error(
        "Failed to load candidate profile.",
        "Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => {
    void loadCandidate()
  }, [loadCandidate])

  async function refreshModuleStatus(moduleKey: string) {
    if (!candidateId) return

    const module = MODULES.find((m) => m.key === moduleKey)
    if (!module) return

    const { data, error } = await supabase
      .from(module.table)
      .select(module.statusSelect)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(`Failed to refresh ${module.table} status`, error)
      return
    }

    setModuleStatuses((prev) => ({
      ...prev,
      [moduleKey]: module.mapStatus(
        data as Record<string, unknown> | null,
      ),
    }))
  }


  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading candidate...
        </p>
      </div>
    )
  }


  /* =======================================================
   * ERROR
   * ======================================================= */

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/app/candidates">
            <ArrowLeft />
            Back to Candidates
          </Link>
        </Button>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error ?? "Candidate not found."}
        </div>
      </div>
    )
  }


  /* =======================================================
   * PAGE
   * ======================================================= */

  const activeModule = MODULES.find((m) => m.key === activeModuleKey) ?? null

  return (
    <div className="min-h-0 space-y-6 pb-6">

      {/* =================================================
       * HEADER
       * ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <Link to="/app/candidates">
              <ArrowLeft />
            </Link>
          </Button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {candidate.name}
              </h1>

              <Badge
                variant={
                  candidate.is_returned ? "destructive" : "default"
                }
              >
                {candidate.is_returned ? "Returned" : "Active"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Passport: {candidate.passport_no}
            </p>
          </div>
        </div>

        <Button onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit Candidate
        </Button>
      </div>


      {/* =================================================
       * OVERVIEW
       * ================================================= */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

        {/* BASIC INFORMATION */}

        <Card>
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Candidate Name"
                value={candidate.name}
              />

              <InfoItem
                label="Passport Number"
                value={candidate.passport_no}
              />

              <InfoItem
                label="Country"
                value={candidate.country ?? "—"}
              />

              <InfoItem
                label="Received Date"
                value={candidate.received_date ?? "—"}
                icon={
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                }
              />

              <InfoItem
                label="Candidate SL"
                value={candidate.sl ?? "—"}
              />

              <InfoItem
                label="Current Stage"
                value={candidate.current_stage ?? "Pending"}
              />

              <InfoItem
                label="Agent"
                value={candidate.agent?.name ?? "—"}
              />

              <InfoItem
                label="Status"
                value={
                  <Badge
                    variant={
                      candidate.is_returned ? "destructive" : "default"
                    }
                  >
                    {candidate.is_returned ? "Returned" : "Active"}
                  </Badge>
                }
              />

              {candidate.is_returned && (
                <InfoItem
                  label="Returned Date"
                  value={candidate.returned_date ?? "—"}
                />
              )}
            </div>
          </CardContent>
        </Card>


        {/* QR */}

        <Card>
          <CardHeader>
            <CardTitle>Candidate QR</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-6">
              <div className="rounded-lg border bg-background p-3 shadow-sm">
                <QRCodeSVG
                  value={`https://overseaserp.vercel.app/candidate/${candidate.id}`}
                  size={150}
                  level="M"
                />
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Scan to open candidate profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* =================================================
       * PROCESSING MODULES — horizontal stepper
       * ================================================= */}

      <Card>
        <CardHeader>
          <CardTitle>Processing Modules</CardTitle>

          <p className="text-sm text-muted-foreground">
            Track every processing stage for this candidate. Tap a step
            to add a record, or "View all" to see its history.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <ProcessingStepper
            moduleStatuses={moduleStatuses}
            documentsStatus={documentsStatus}
            candidateId={candidate.id}
            onAdd={(moduleKey) => setActiveModuleKey(moduleKey)}
          />
        </CardContent>
      </Card>


      {/* =================================================
       * QUICK-ADD SHEET (shared across every module)
       * ================================================= */}

      {activeModule && (
        <ModuleQuickAddSheet
          module={activeModule}
          candidateId={candidate.id}
          tenantId={profile?.tenant_id ?? null}
          open={!!activeModuleKey}
          onOpenChange={(open) => {
            if (!open) setActiveModuleKey(null)
          }}
          onSuccess={() => {
            void refreshModuleStatus(activeModule.key)
          }}
        />
      )}


      {/* =================================================
       * EDIT CANDIDATE
       * ================================================= */}

      <CandidateFormDialog
        open={editOpen}
        candidate={candidate}
        onOpenChange={setEditOpen}
        onSuccess={(updated) => {
          setCandidate(updated)
        }}
      />
    </div>
  )
}
