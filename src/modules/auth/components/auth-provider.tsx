import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import {
  getProfile,
  getTenant,
} from "@/lib/supabase/auth";

import { supabase } from "@/lib/supabase/client";

interface Profile {
  id: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  country: string;
  timezone: string;
  language: string;
  currency: string;
  is_active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [tenant, setTenant] =
    useState<Tenant | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async (
      currentSession: Session | null,
    ) => {
      if (!currentSession?.user) {
        setProfile(null);
        setTenant(null);
        return;
      }

      const { data: profile } = await getProfile(
        currentSession.user.id,
      );

      setProfile(profile);

      if (!profile?.tenant_id) {
        setTenant(null);
        return;
      }

      const { data: tenant } = await getTenant(
        profile.tenant_id,
      );

      setTenant(tenant);
    };

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      await loadUserData(session);

      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        await loadUserData(session);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    tenant,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}