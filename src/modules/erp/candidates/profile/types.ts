import type { ReactNode } from "react"

/* =========================================================
 * MODULE STATUS
 * ========================================================= */

export type ModuleStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "not_started"

export type FieldValues = Record<string, string | boolean>

export interface ModuleField {
  key: string
  label: string
  type: "text" | "date" | "select" | "switch"
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  showIf?: (values: FieldValues) => boolean
}

export interface ModuleConfig {
  key: string
  title: string
  description: string
  icon: ReactNode
  table: string
  statusSelect: string

  /** Column used as the "date" for this module (timeline + record list). */
  dateField: string

  href: (candidateId: string) => string
  fields: ModuleField[]
  defaultValues: () => FieldValues
  buildPayload: (
    values: FieldValues,
    candidateId: string,
    tenantId: string,
  ) => Record<string, unknown>
  mapStatus: (row: Record<string, unknown> | null) => ModuleStatus

  /** One-line human summary of a row, used in the timeline + record list. */
  summary: (row: Record<string, unknown>) => string
}

/** A single row pulled back from a module's table. */
export type ModuleRecord = Record<string, unknown> & {
  id: string | number
  created_at: string
}

/** A normalized row used to render the Timeline table. */
export interface TimelineEntry {
  moduleKey: string
  moduleTitle: string
  icon: ReactNode
  date: string | null
  status: ModuleStatus
  details: string
}
