import { supabase } from "@/lib/supabase/client";

export type InvitationRole =
  | "ADMIN"
  | "MANAGER"
  | "STAFF";

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
  status:
    | "pending"
    | "accepted"
    | "revoked"
    | "expired";
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


/**
 * Create a new workspace invitation.
 */
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


/**
 * Get all active members of the current workspace.
 *
 * Authorization is handled by the secure database RPC.
 */
export async function getTenantMembers(): Promise<
  TenantMember[]
> {
  const { data, error } = await supabase.rpc(
    "get_tenant_members",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TenantMember[];
}


/**
 * Get pending invitations for the current workspace.
 *
 * Authorization is handled by the secure database RPC.
 */
export async function getTenantInvitations(): Promise<
  TenantInvitation[]
> {
  const { data, error } = await supabase.rpc(
    "get_tenant_invitations",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TenantInvitation[];
}


/**
 * Revoke a pending workspace invitation.
 *
 * Authorization is handled by the secure database RPC.
 */
export async function revokeTenantInvitation(
  invitationId: string,
): Promise<void> {
  const cleanId = invitationId.trim();

  if (!cleanId) {
    throw new Error(
      "Invitation ID is required",
    );
  }

  const { error } = await supabase.rpc(
    "revoke_tenant_invitation",
    {
      p_invitation_id: cleanId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}


/**
 * Accept a workspace invitation.
 */
export async function acceptTenantInvitation(
  token: string,
) {
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error(
      "Invitation token is required",
    );
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
export interface CreateWorkspaceUserInput {
  email: string;
  role: InvitationRole;
}

export interface CreatedWorkspaceUser {
  id: string;
  email: string;
  role: TenantMemberRole;
}

export interface CreateWorkspaceUserResult {
  success: true;
  user: CreatedWorkspaceUser;
  temporaryPassword: string;
}

export async function createWorkspaceUser(
  input: CreateWorkspaceUserInput,
): Promise<CreateWorkspaceUserResult> {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required");
  }

  const role = input.role;

  if (!["ADMIN", "MANAGER", "STAFF"].includes(role)) {
    throw new Error("Invalid user role");
  }

  const { data, error } = await supabase.functions.invoke(
    "create-workspace-user",
    {
      body: {
        email,
        role,
      },
    },
  );

  if (error) {
    throw new Error(
      error.message || "Unable to create workspace user",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error || "Unable to create workspace user",
    );
  }

  if (
    typeof data.temporaryPassword !== "string" ||
    !data.temporaryPassword
  ) {
    throw new Error(
      "User was created but temporary password was not returned.",
    );
  }

  return data as CreateWorkspaceUserResult;
}