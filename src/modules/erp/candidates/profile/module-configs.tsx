import {
  Award,
  CheckCircle2,
  Clock3,
  FileText,
  Fingerprint,
  IdCard,
  Plane,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react"

import type { ModuleConfig, ModuleStatus } from "./types"


/* =========================================================
 * STATUS CONFIG (display)
 * ========================================================= */

export function getStatusConfig(status: ModuleStatus) {
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
 * only requires a new entry here — status badges, the record
 * list/add sheet, and the timeline are all generated from
 * this config.
 * ========================================================= */

export const MODULES: ModuleConfig[] = [
  {
    key: "medical",
    title: "Medical",
    description: "Medical examination and fitness records.",
    icon: <Stethoscope className="h-4 w-4" />,
    table: "medicals",
    statusSelect: "status, created_at",
    dateField: "medical_date",
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
    summary: (row) => `Status: ${String(row.status ?? "—")}`,
  },

  {
    key: "police_clearance",
    title: "Police Clearance",
    description: "Police clearance verification records.",
    icon: <ShieldCheck className="h-4 w-4" />,
    table: "police_clearances",
    statusSelect: "verified, created_at",
    dateField: "received_date",
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
    summary: (row) =>
      row.verified ? `Verified on ${row.verified_date ?? "—"}` : "Not verified yet",
  },

  {
    key: "finger",
    title: "Finger",
    description: "Fingerprint registration and records.",
    icon: <Fingerprint className="h-4 w-4" />,
    table: "fingers",
    statusSelect: "status, created_at",
    dateField: "finger_date",
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
    summary: (row) =>
      `${String(row.finger_type ?? "—")} • ${String(row.status ?? "—")}`,
  },

  {
    key: "mofa",
    title: "MOFA",
    description: "Ministry approval and application processing.",
    icon: <FileText className="h-4 w-4" />,
    table: "mofas",
    statusSelect: "stage, created_at",
    dateField: "application_date",
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
    summary: (row) =>
      `${String(row.application_number ?? "—")} • ${String(row.trade ?? "—")} • ${String(row.stage ?? "—")}`,
  },

  {
    key: "takamul",
    title: "Takamul",
    description: "Trade test scheduling and results.",
    icon: <Award className="h-4 w-4" />,
    table: "trade_tests",
    statusSelect: "status, result, created_at",
    dateField: "test_date",
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
    summary: (row) =>
      `${String(row.test_center ?? "—")} • ${String(row.result ?? "—")}/${String(row.status ?? "—")}`,
  },

  {
    key: "visa",
    title: "Visa",
    description: "Visa application and processing records.",
    icon: <IdCard className="h-4 w-4" />,
    table: "visas",
    statusSelect: "status, created_at",
    dateField: "visa_date",
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
    summary: (row) =>
      `${String(row.visa_no ?? "—")} • ${String(row.status ?? "—")}`,
  },

  {
    key: "flight",
    title: "Flight",
    description: "Flight booking and travel information.",
    icon: <Plane className="h-4 w-4" />,
    table: "flights",
    statusSelect: "status, created_at",
    dateField: "flight_date",
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
    summary: (row) =>
      `${String(row.airline ?? "—")} ${String(row.flight_no ?? "")} • ${String(row.status ?? "—")}`,
  },
]
