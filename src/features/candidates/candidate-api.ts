import { supabase } from '@/lib/supabase'

import type {
  Candidate,
  CreateCandidateInput,
  UpdateCandidateInput,
} from './candidate-types'

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

/**
 * Get all active candidates
 *
 * Tenant filtering is NOT done here.
 * PostgreSQL RLS handles tenant isolation.
 */
export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select(candidateSelect)
    .eq('is_deleted', false)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data as Candidate[]
}

/**
 * Get one candidate by ID.
 */
export async function getCandidateById(
  id: number,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .select(candidateSelect)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    throw error
  }

  return data as Candidate
}

/**
 * Create candidate.
 *
 * tenant_id is intentionally NOT accepted from the UI.
 */
export async function createCandidate(
  input: CreateCandidateInput,
): Promise<Candidate> {
  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

  if (profileError) {
    throw profileError
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert({
      ...input,
      tenant_id: profile.tenant_id,
      created_by: user.id,
    })
    .select(candidateSelect)
    .single()

  if (error) {
    throw error
  }

  return data as Candidate
}

/**
 * Update candidate.
 *
 * RLS ensures that the candidate belongs
 * to the authenticated user's tenant.
 */
export async function updateCandidate(
  id: number,
  input: UpdateCandidateInput,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update(input)
    .eq('id', id)
    .select(candidateSelect)
    .single()

  if (error) {
    throw error
  }

  return data as Candidate
}

/**
 * Soft delete candidate.
 */
export async function deleteCandidate(
  id: number,
): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update({
      is_deleted: true,
    })
    .eq('id', id)

  if (error) {
    throw error
  }
}
export async function setCandidateReturned(
  id: number,
  returned: boolean,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update({
      is_returned: returned,
      returned_date: returned
        ? new Date().toISOString()
        : null,
    })
    .eq('id', id)
    .select(candidateSelect)
    .single()

  if (error) {
    throw error
  }

  return data as Candidate
}