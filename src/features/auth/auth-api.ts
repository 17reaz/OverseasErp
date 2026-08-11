import { supabase } from '@/lib/supabase'

export type SignUpInput = {
  email: string
  password: string
  fullName: string
}

export type SignInInput = {
  email: string
  password: string
}

/**
 * Create a new user account.
 *
 * Tenant + OWNER profile will be created
 * by the Supabase database trigger.
 */
export async function signUp({
  email,
  password,
  fullName,
}: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign in an existing user.
 */
export async function signIn({
  email,
  password,
}: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}
export type Agent = {
  id: number
  name: string
  code: string | null
}

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      code
    `)
    .order('name', {
      ascending: true,
    })

  if (error) {
    throw error
  }

  return data as Agent[]
}