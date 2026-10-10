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

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const loginSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authRequestId = 0;

    async function loadUserData(
      currentSession: Session | null,
    ): Promise<Profile | null> {
      if (!currentSession?.user) {
        if (!mounted) return null;

        setProfile(null);
        setTenant(null);
        setMemberships([]);

        return null;
      }

      // 1. Load profile
      const {
        data: currentProfile,
        error: profileError,
      } = await getProfile(currentSession.user.id);

      if (!mounted) return null;

      if (profileError || !currentProfile) {
        console.error("Failed to load profile:", profileError);

        setProfile(null);
        setTenant(null);
        setMemberships([]);

        return null;
      }

      // 2. Load tenant memberships
      const {
        data: currentMemberships,
        error: membershipError,
      } = await getMyTenantMemberships();

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

      const safeMemberships: TenantMembership[] =
        (currentMemberships ?? []) as TenantMembership[];

      setMemberships(safeMemberships);

      // 3. Resolve active workspace
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

      // 4. Normalize profile for the active workspace
      const normalizedProfile: Profile = {
        ...currentProfile,
        tenant_id: activeMembership.tenant_id,
        role: activeMembership.role,
      };

      setProfile(normalizedProfile);

      // 5. Load active tenant
      const {
        data: currentTenant,
        error: tenantError,
      } = await getTenant(activeMembership.tenant_id);

      if (!mounted) return normalizedProfile;

      if (tenantError) {
        console.error("Failed to load tenant:", tenantError);
        setTenant(null);

        return normalizedProfile;
      }

      setTenant(currentTenant);

      return normalizedProfile;
    }

    async function initializeAuth() {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Failed to get auth session:", error);
          setLoading(false);
          return;
        }

        setSession(currentSession);

        const currentProfile = await loadUserData(currentSession);

        if (
          !mounted
        ) {
          return;
        }

        if (currentSession && currentProfile?.tenant_id) {
          const {
            data,
            error: loginSessionError,
          } = await createLoginSession(currentSession, {
            id: currentProfile.id,
            tenant_id: currentProfile.tenant_id,
          });

          if (loginSessionError) {
            console.error(
              "Failed to create login session:",
              loginSessionError,
            );
          } else if (data?.session_id) {
            loginSessionIdRef.current = data.session_id;
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);

        // Handle sign-out immediately.
        if (event === "SIGNED_OUT") {
          authRequestId += 1;

          const sessionId = loginSessionIdRef.current;
          loginSessionIdRef.current = null;

          if (sessionId) {
            void closeLoginSession(sessionId);
          }

          setProfile(null);
          setTenant(null);
          setMemberships([]);
          setLoading(false);

          return;
        }

        // Ignore token refreshes for UI loading purposes.
        // They should not replace the ERP screen with Loading...
        if (
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION"
        ) {
          return;
        }

        // Only show the full-screen loading state for a
        // meaningful auth/profile change, not every auth event.
        const shouldShowLoading =
          event === "SIGNED_IN" ||
          event === "USER_UPDATED";

        if (shouldShowLoading) {
          setLoading(true);
        }

        const requestId = ++authRequestId;

        // Defer Supabase calls until after the auth callback.
        setTimeout(async () => {
          if (!mounted || requestId !== authRequestId) return;

          try {
            const updatedProfile = await loadUserData(currentSession);

            if (!mounted || requestId !== authRequestId) return;

            if (
              event === "SIGNED_IN" &&
              currentSession &&
              updatedProfile?.tenant_id
            ) {
              const {
                data,
                error,
              } = await createLoginSession(currentSession, {
                id: updatedProfile.id,
                tenant_id: updatedProfile.tenant_id,
              });

              if (!mounted || requestId !== authRequestId) return;

              if (error) {
                console.error(
                  "Failed to create login session:",
                  error,
                );
              } else if (data?.session_id) {
                loginSessionIdRef.current = data.session_id;
              }
            }
          } catch (error) {
            console.error("Auth state update failed:", error);
          } finally {
            if (
              mounted &&
              requestId === authRequestId &&
              shouldShowLoading
            ) {
              setLoading(false);
            }
          }
        }, 0);
      },
    );

    return () => {
      mounted = false;
      authRequestId += 1;
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
