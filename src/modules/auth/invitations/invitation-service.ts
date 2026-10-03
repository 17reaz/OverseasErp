import { supabase } from "@/lib/supabase/client";

export type InvitationRole = "ADMIN" | "MANAGER" | "STAFF";

export type TenantMemberRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "STAFF";

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: InvitationRole;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CreateInvitationInput {
  email: string;
  role: InvitationRole;
}

export interface TenantMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: TenantMemberRole;
  is_active: boolean;
  created_at: string;
}


/* =========================================================
   Create invitation
   ========================================================= */

export async function createTenantInvitation(
  input: CreateInvitationInput,
) {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required");
  }

  const { data, error } = await supabase.rpc(
    "create_tenant_invitation",
    {
      p_email: email,
      p_role: input.role,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as TenantInvitation;
}


/* =========================================================
   Get current workspace members
   ========================================================= */

export async function getTenantMembers(): Promise<TenantMember[]> {
  const { data, error } = await supabase.rpc(
    "get_tenant_members",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TenantMember[];
}


/* =========================================================
   Accept invitation
   ========================================================= */

export async function acceptTenantInvitation(
  token: string,
) {
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error("Invitation token is required");
  }

  const { data, error } = await supabase.rpc(
    "accept_tenant_invitation",
    {
      p_token: cleanToken,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}