export type Candidate = {
  id: number
  sl: number | null
  passport_no: string
  name: string
  received_date: string | null
  country: string | null
  current_stage: string
  agent_id: number | null
  is_returned: boolean
  returned_date: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type CreateCandidateInput = {
  passport_no: string
  name: string
  received_date?: string | null
  country?: string | null
  agent_id?: number | null
}

export type UpdateCandidateInput = {
  passport_no?: string
  name?: string
  received_date?: string | null
  country?: string | null
  current_stage?: string
  agent_id?: number | null
  is_returned?: boolean
  returned_date?: string | null
}