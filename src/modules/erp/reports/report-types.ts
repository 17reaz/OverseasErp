export type ReportType =
  | "candidates"
  | "medical"
  | "mofa"
  | "visa"
  | "flight"

export type ReportColumn = {
  id: string
  label: string
}

export type ReportFilters = {
  agentId?: string
  country?: string
  stage?: string
  status?: "all" | "active" | "returned"
}

export type ReportConfig = {
  name: string
  type: ReportType
  dateFrom?: string
  dateTo?: string
  columns: string[]
  filters: ReportFilters
}
export type ReportRow = {
  id: string
  sl?: number | string | null
  name?: string | null
  passport_no?: string | null
  country?: string | null
  agent?: string | null
  stage?: string | null
  status?: string | null
  received_date?: string | null

  airline?: string | null
}