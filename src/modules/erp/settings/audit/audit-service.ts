import { supabase } from "@/lib/supabase/client"

export type AuditAction = "INSERT" | "UPDATE" | "DELETE"

export interface AuditLog {
  id: number
  tenant_id: string
  actor_id: string | null
  actor_name: string | null
  actor_role: string | null
  table_name: string
  record_id: string | null
  record_label: string | null
  action: AuditAction
  changed_fields: string[] | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export interface AuditFilters {
  table: string // "all" or a table name
  action: string // "all" or INSERT / UPDATE / DELETE
  search: string
  from: string // YYYY-MM-DD or ""
  to: string // YYYY-MM-DD or ""
}

export const AUDIT_PAGE_SIZE = 25

export async function getAuditLogs(filters: AuditFilters, page: number) {
  const start = page * AUDIT_PAGE_SIZE

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, start + AUDIT_PAGE_SIZE - 1)

  if (filters.table !== "all") {
    query = query.eq("table_name", filters.table)
  }

  if (filters.action !== "all") {
    query = query.eq("action", filters.action)
  }

  if (filters.from) {
    query = query.gte(
      "created_at",
      new Date(`${filters.from}T00:00:00`).toISOString(),
    )
  }

  if (filters.to) {
    query = query.lte(
      "created_at",
      new Date(`${filters.to}T23:59:59.999`).toISOString(),
    )
  }

  // strip characters that would break PostgREST's or() syntax
  const search = filters.search.replace(/[,()%]/g, " ").trim()

  if (search) {
    query = query.or(
      `record_label.ilike.%${search}%,actor_name.ilike.%${search}%`,
    )
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    rows: (data ?? []) as AuditLog[],
    total: count ?? 0,
  }
}