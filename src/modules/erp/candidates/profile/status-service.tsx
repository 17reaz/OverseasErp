import { FolderOpen } from "lucide-react"

import { supabase } from "@/lib/supabase/client"

import { MODULES } from "./module-configs"
import type { ModuleRecord, ModuleStatus, TimelineEntry } from "./types"


/* =========================================================
 * STATUS BADGES (candidate profile stepper)
 * ========================================================= */

export async function fetchModuleStatuses(
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

export async function fetchDocumentsStatus(
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

export async function refreshModuleStatus(
  moduleKey: string,
  candidateId: string,
): Promise<ModuleStatus | null> {
  const module = MODULES.find((m) => m.key === moduleKey)
  if (!module) return null

  const { data, error } = await supabase
    .from(module.table)
    .select(module.statusSelect)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`Failed to refresh ${module.table} status`, error)
    return null
  }

  return module.mapStatus(data as Record<string, unknown> | null)
}


/* =========================================================
 * RECORD LIST (used by the module records sheet — shows
 * existing rows for a module so the user sees data before
 * being offered "Add New").
 * ========================================================= */

export async function fetchModuleRecords(
  moduleKey: string,
  candidateId: string,
): Promise<ModuleRecord[]> {
  const module = MODULES.find((m) => m.key === moduleKey)
  if (!module) return []

  const { data, error } = await supabase
    .from(module.table)
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Failed to load ${module.table} records`, error)
    return []
  }

  return (data ?? []) as ModuleRecord[]
}


/* =========================================================
 * TIMELINE (all modules + documents, merged and sorted)
 * ========================================================= */

export async function fetchTimeline(
  candidateId: string,
): Promise<TimelineEntry[]> {
  const moduleEntries = await Promise.all(
    MODULES.map(async (module) => {
      const { data, error } = await supabase
        .from(module.table)
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error(`Failed to load ${module.table} timeline rows`, error)
        return [] as TimelineEntry[]
      }

      return ((data ?? []) as ModuleRecord[]).map<TimelineEntry>((row) => ({
        moduleKey: module.key,
        moduleTitle: module.title,
        icon: module.icon,
        date: (row[module.dateField] as string | null) ?? row.created_at,
        status: module.mapStatus(row),
        details: module.summary(row),
      }))
    }),
  )

  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("id, doc_type, created_at, is_active")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })

  const documentEntries: TimelineEntry[] = filesError
    ? []
    : (files ?? []).map((row) => ({
        moduleKey: "documents",
        moduleTitle: "Documents",
        icon: <FolderOpen className="h-4 w-4" />,
        date: row.created_at as string,
        status: row.is_active ? "completed" : "not_started",
        details: `Uploaded: ${String(row.doc_type ?? "document")}`,
      }))

  return [...moduleEntries.flat(), ...documentEntries].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}
