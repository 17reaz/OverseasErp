import { supabase } from '@/lib/supabase'

import type {
  Candidate,
  CreateCandidateInput,
  UpdateCandidateInput,
} from './candidate-types'

export type Agent = {
  id: number
  name: string
  code: string | null
}

const candidateSelect = `
  id,
  sl,
  passport_no,
  name,
  received_date,
  country,
  current_stage,
  agent_id,
  is_returned,
  returned_date,
  is_deleted,
  created_at,
  updated_at
`

export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select(candidateSelect)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Candidate[]
}

export async function getCandidateById(id: number): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .select(candidateSelect)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as Candidate
}

/**
 * Loads agents visible to the authenticated tenant through RLS.
 * This assumes the existing `agents` table exposes id, name and code.
 */
export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, code')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Agent[]
}

export async function createCandidate(
  input: CreateCandidateInput,
): Promise<Candidate> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be logged in')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  if (!profile?.tenant_id) throw new Error('Your account has no tenant')

  const { data, error } = await supabase
    .from('candidates')
    .insert({
      ...input,
      tenant_id: profile.tenant_id,
      created_by: user.id,
    })
    .select(candidateSelect)
    .single()

  if (error) throw error
  return data as Candidate
}

export async function updateCandidate(
  id: number,
  input: UpdateCandidateInput,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update(input)
    .eq('id', id)
    .eq('is_deleted', false)
    .select(candidateSelect)
    .single()

  if (error) throw error
  return data as Candidate
}

export async function deleteCandidate(id: number): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('is_deleted', false)

  if (error) throw error
}

export async function setCandidateReturned(
  id: number,
  returned: boolean,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update({
      is_returned: returned,
      returned_date: returned ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('is_deleted', false)
    .select(candidateSelect)
    .single()

  if (error) throw error
  return data as Candidate
}
