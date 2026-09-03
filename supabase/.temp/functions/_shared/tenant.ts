// supabase/functions/_shared/tenant.ts
//
// SECURITY-CRITICAL:
// tenant_id is NEVER trusted from the request body. It is always
// resolved server-side from the caller's own JWT -> profiles row,
// using a client scoped to that user's own RLS permissions.
//
// Pattern mirrors src/lib/supabase/auth.ts (getProfile/getTenant)
// used throughout the existing frontend.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface CallerContext {
  userId: string;
  tenantId: string;
  role: string;
  // Scoped to the caller's JWT — every query through this client is
  // subject to the same RLS policies as the browser client.
  userClient: SupabaseClient;
  // service_role client — bypasses RLS. Use ONLY for operations that
  // are explicitly tenant-scoped by code below (job rows, storage).
  adminClient: SupabaseClient;
}

export class UnauthorizedError extends Error {}

export async function resolveCaller(req: Request): Promise<CallerContext> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("Missing Authorization header.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // User-scoped client: RLS applies exactly as it would in the browser.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new UnauthorizedError("Invalid or expired session.");
  }

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("id, tenant_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new UnauthorizedError("No profile found for this user.");
  }

  if (!profile.is_active) {
    throw new UnauthorizedError("This account is inactive.");
  }

  // service_role client — bypasses RLS entirely. Every query made with
  // this client below MUST be explicitly filtered by tenantId resolved
  // above. Never forward a client-supplied tenant_id to this client.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    userId: user.id,
    tenantId: profile.tenant_id as string,
    role: profile.role as string,
    userClient,
    adminClient,
  };
}
