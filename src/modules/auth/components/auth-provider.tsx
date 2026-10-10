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
  getMyTenantMemberships,
} from "@/lib/supabase/auth";

import { supabase } from "@/lib/supabase/client";

import {
  closeLoginSession,
  createLoginSession,
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
  access_type:
    | "early_access"
    | "monthly"
    | "yearly"
    | "lifetime"
    | "free_trial";
  is_active: boolean;
}

export interface TenantMembership {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: string;
  is_active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  memberships: TenantMembership[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [memberships, setMemberships] = useState<TenantMembership[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const loginSessionIdRef = useRef<string | null>(null);

  /*
   * Tracks which user is currently loaded. Used to ignore the
   * SIGNED_IN event Supabase fires again when the browser tab
   * regains focus, so we don't reload or show the loader.
   */
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUserData(currentSession: Session | null) {
      if (!currentSession?.user) {
        if (!mounted) return null;

        setProfile(null);
        setTenant(null);
        setMemberships([]);

        return null;
      }

      /*
       * ------------------------------------------------------
       * 1. Load the user's profile
       * ------------------------------------------------------
       *
       * We keep this because the rest of the application
       * currently depends on the existing Profile shape.
       */
      const { data: currentProfile, error: profileError } =
        await getProfile(currentSession.user.id);

      if (!mounted) return null;

      if (profileError || !currentProfile) {
        console.error("Failed to load profile:", profileError);

        setProfile(null);
        setTenant(null);
        setMemberships([]);

        return null;
      }

      /*
       * ------------------------------------------------------
       * 2. Load memberships
       * ------------------------------------------------------
       *
       * This is now the source for workspace membership.
       */
      const { data: currentMemberships, error: membershipError } =
        await getMyTenantMemberships();

      if (!mounted) return null;

      if (membershipError) {
        console.error(
          "Failed to load workspace memberships:",
          membershipError,
        );

        setProfile(currentProfile);
        setTenant(null);
        setMemberships([]);

        return currentProfile;
      }

      const safeMemberships: TenantMembership[] = (currentMemberships ??
        []) as TenantMembership[];

      setMemberships(safeMemberships);

      /*
       * ------------------------------------------------------
       * 3. Resolve active workspace
       * ------------------------------------------------------
       *
       * For now the existing profile.tenant_id remains the
       * active workspace. This keeps the current ERP stable.
       *
       * Later we will add workspace switching without
       * changing the ERP modules all at once.
       */
      const activeMembership =
        safeMemberships.find(
          (membership) =>
            membership.tenant_id === currentProfile.tenant_id,
        ) ??
        safeMemberships[0] ??
        null;

      if (!activeMembership) {
        console.error("No active workspace membership found.");

        setProfile(currentProfile);
        setTenant(null);

        return currentProfile;
      }

      /*
       * ------------------------------------------------------
       * 4. Keep profile compatible with existing application
       * ------------------------------------------------------
       *
       * If the membership layer becomes the source of truth
       * for role/workspace, these values will eventually come
       * from membership instead of profiles.
       */
      const normalizedProfile: Profile = {
        ...currentProfile,
        tenant_id: activeMembership.tenant_id,
        role: activeMembership.role,
      };

      setProfile(normalizedProfile);

      /*
       * ------------------------------------------------------
       * 5. Load active tenant
       * ------------------------------------------------------
       */
      const { data: currentTenant, error: tenantError } =
        await getTenant(activeMembership.tenant_id);

      if (!mounted) return normalizedProfile;

      if (tenantError) {
        console.error("Failed to load tenant:", tenantError);

        setTenant(null);

        return normalizedProfile;
      }

      setTenant(currentTenant);

      return normalizedProfile;
    }

    async function startLoginSession(
      currentSession: Session,
      currentProfile: Profile,
    ) {
      const { data, error } = await createLoginSession(
        currentSession,
        {
          id: currentProfile.id,
          tenant_id: currentProfile.tenant_id,
        },
      );

      if (error) {
        console.error("Failed to create login session:", error);
      } else if (data?.session_id) {
        loginSessionIdRef.current = data.session_id;
      }
    }

    async function initializeAuth() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);

      const currentProfile = await loadUserData(currentSession);

      currentUserIdRef.current = currentSession?.user?.id ?? null;

      if (currentSession && currentProfile?.tenant_id) {
        await startLoginSession(currentSession, currentProfile);
      }

      if (mounted) {
        setLoading(false);
      }
    }

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      // initializeAuth already handles the first load
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_OUT") {
        const sessionId = loginSessionIdRef.current;

        loginSessionIdRef.current = null;
        currentUserIdRef.current = null;

        if (sessionId) {
          void closeLoginSession(sessionId);
        }

        setSession(null);
        setProfile(null);
        setTenant(null);
        setMemberships([]);
        setLoading(false);

        return;
      }

      // Token refresh: only update the session, no reload, no loader
      if (event === "TOKEN_REFRESHED") {
        setSession(currentSession);

        return;
      }

      const isSameUser =
        !!currentSession?.user?.id &&
        currentSession.user.id === currentUserIdRef.current;

      // Tab refocus fires SIGNED_IN for the same user: ignore it
      if (event === "SIGNED_IN" && isSameUser) {
        setSession(currentSession);

        return;
      }

      setSession(currentSession);

      // Show the loader only when a different user is signing in
      if (!isSameUser) {
        setLoading(true);
      }

      /*
       * Do not make Supabase calls directly
       * inside onAuthStateChange.
       */
      setTimeout(async () => {
        if (!mounted) return;

        const currentProfile = await loadUserData(currentSession);

        if (
          event === "SIGNED_IN" &&
          currentSession &&
          currentProfile?.tenant_id
        ) {
          currentUserIdRef.current = currentSession.user.id;

          await startLoginSession(currentSession, currentProfile);
        }

        if (mounted) {
          setLoading(false);
        }
      }, 0);
    });

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
    memberships,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
