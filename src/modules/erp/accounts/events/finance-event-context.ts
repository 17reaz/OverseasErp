import { supabase } from "@/lib/supabase/client";

import {
  FinanceEventContextError,
} from "./finance-event-errors";

/**
 * Runtime context required by the Finance Event Engine.
 *
 * This context identifies who is creating the event
 * and which tenant owns the financial data.
 */
export interface FinanceEventContext {
  userId: string;
  profileId: string;
  tenantId: string;
}

/**
 * Resolve the authenticated ERP context.
 *
 * Flow:
 *
 * Auth User
 *    ↓
 * Profile
 *    ↓
 * Tenant
 *
 * The Finance Event Engine uses this context for every
 * financial event so ERP modules do not need to resolve
 * tenant/user information themselves.
 */
export async function getFinanceEventContext(): Promise<FinanceEventContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new FinanceEventContextError(
      `Unable to resolve authenticated user: ${authError.message}`,
    );
  }

  if (!user) {
    throw new FinanceEventContextError(
      "No authenticated user was found.",
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new FinanceEventContextError(
      `Unable to resolve user profile: ${profileError.message}`,
    );
  }

  if (!profile) {
    throw new FinanceEventContextError(
      "Authenticated user does not have an ERP profile.",
    );
  }

  if (!profile.tenant_id) {
    throw new FinanceEventContextError(
      "Authenticated user is not associated with a tenant.",
    );
  }

  return {
    userId: user.id,
    profileId: profile.id,
    tenantId: profile.tenant_id,
  };
}