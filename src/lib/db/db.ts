import Dexie, { type Table } from "dexie"

export interface CacheMetadata {
  key: string
  updatedAt: number
}
export interface CachedCandidate {
  id: string
  tenant_id: string
  sl: number | null
  passport_no: string | null
  name: string | null
  received_date: string | null
  country: string | null
  created_by: string | null
  agent_id: string | null
  current_stage: string | null
  workflow_state: string | null
  hold_reason: string | null
workflow_updated_at?: string | null
  is_returned: boolean
  returned_date: string | null
  returned_reason: string | null
  final_status: string | null
  final_reason: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  agent: {
    id: string 
    name: string | null
    code: string | null
  } | null
  cached_at: number
}
export class AppDatabase extends Dexie {
  cacheMetadata!: Table<CacheMetadata, string>
  candidates!: Table<CachedCandidate, string>
  constructor() {
    super("overseas-erp")

    this.version(1).stores({
      cacheMetadata: "key",
    })
    this.version(2).stores({
    cacheMetadata: "key",
    candidates: "id, tenant_id, sl, passport_number, current_stage, updated_at",
    })
  }
}

export const db = new AppDatabase()