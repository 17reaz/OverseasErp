import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-provider'

export type Profile = {
  id: string
  tenant_id: string
  full_name: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF'
  phone: string | null
  avatar: string | null
  is_active: boolean
}

export type Tenant = {
  id: string
  name: string
  slug: string
  logo: string | null
  phone: string | null
  email: string | null
  country: string | null
  timezone: string | null
  subscription_plan: string
  is_active: boolean
}

type ProfileContextValue = {
  profile: Profile | null
  tenant: Tenant | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<
  ProfileContextValue | undefined
>(undefined)

type ProfileProviderProps = {
  children: ReactNode
}

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const { user, loading: authLoading } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    if (!user) {
      setProfile(null)
      setTenant(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        tenant_id,
        full_name,
        role,
        phone,
        avatar,
        is_active,
        tenant:tenants (
          id,
          name,
          slug,
          logo,
          phone,
          email,
          country,
          timezone,
          subscription_plan,
          is_active
        )
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      setProfile(null)
      setTenant(null)
      setLoading(false)
      throw error
    }

    setProfile({
      id: data.id,
      tenant_id: data.tenant_id,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      avatar: data.avatar,
      is_active: data.is_active,
    })

    setTenant(data.tenant as unknown as Tenant)

    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return

    loadProfile()
  }, [user, authLoading])

  return (
    <ProfileContext.Provider
      value={{
        profile,
        tenant,
        loading: authLoading || loading,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider',
    )
  }

  return context
}