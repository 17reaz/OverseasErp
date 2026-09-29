import { supabase } from "@/lib/supabase/client";

export interface LoginSession {
  id: string;
  session_id: string;
  user_id: string;
  tenant_id: string;
  login_at: string;
  last_seen_at: string;
  logout_at: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getLoginSessions() {
  const { data, error } = await supabase
    .from("login_sessions")
    .select(`
      id,
      session_id,
      user_id,
      tenant_id,
      login_at,
      last_seen_at,
      logout_at,
      device,
      browser,
      os,
      location,
      is_active,
      created_at,
      updated_at
    `)
    .order("login_at", {
      ascending: false,
    });

  return {
    data: (data ?? []) as LoginSession[],
    error,
  };
}