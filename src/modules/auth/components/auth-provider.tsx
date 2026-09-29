import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";
import {
  getProfile,
  getTenant,
} from "@/lib/supabase/auth";

import { supabase } from "@/lib/supabase/client";
import {
  closeLoginSession,
  createLoginSession,
  // updateLoginSessionHeartbeat,
} from "../services/login-session-service";

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
   sl: number;
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
 access_type: "early_access" | "monthly" | "yearly" | "lifetime" | "free_trial";
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
  const loginSessionIdRef = useRef<string | null>(
  null,
);
  useEffect(() => {
    let mounted = true;

    async function loadUserData(
      currentSession: Session | null,
    ) {
      if (!currentSession?.user) {
  if (!mounted) return null;

  setProfile(null);
  setTenant(null);
  return null;
}

      const { data: profile } = await getProfile(
        currentSession.user.id,
      );

      if (!mounted) return;

      setProfile(profile);

      if (!profile?.tenant_id) {
  setTenant(null);
  return profile;
}

      const { data: tenant } = await getTenant(
        profile.tenant_id,
      );

      if (!mounted) return profile;

setTenant(tenant);

return profile;
    }

    async function initializeAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!mounted) return;

  setSession(session);

  const currentProfile =
    await loadUserData(session);

  if (
    session &&
    currentProfile?.tenant_id
  ) {
    const { data, error } =
      await createLoginSession(
        session,
        {
          id: currentProfile.id,
          tenant_id:
            currentProfile.tenant_id,
        },
      );

    if (error) {
      console.error(
        "Failed to create login session:",
        error,
      );
    } else if (data?.session_id) {
      loginSessionIdRef.current =
        data.session_id;
    }
  }

  if (mounted) {
    setLoading(false);
  }
}

    initializeAuth();

    const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (!mounted) return;

    setSession(session);

   if (event === "SIGNED_OUT") {
  const sessionId =
    loginSessionIdRef.current;

  loginSessionIdRef.current = null;

  if (sessionId) {
    void closeLoginSession(sessionId);
  }

  setProfile(null);
  setTenant(null);
  setLoading(false);

  return;
}

    setLoading(true);

    // Do not make Supabase calls directly
    // inside onAuthStateChange.
    setTimeout(async () => {
      if (!mounted) return;

      await loadUserData(session);

      if (mounted) {
        setLoading(false);
      }
    }, 0);
  },
);

    return () => {
      mounted = false;
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