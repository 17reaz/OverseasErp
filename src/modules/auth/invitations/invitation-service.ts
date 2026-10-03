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
 *
 * V2 only.
 * Current V1 user creation does not use this function.
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
 * Get pending invitations.
 *
 * V2 only.
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
 * V2 only.
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
 *
 * V2 only.
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


/* ============================================================
 * V1 — Immediate Workspace User Creation
 * ============================================================
 */

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


function extractFunctionErrorMessage(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object"
  ) {
    const candidate =
      error as {
        message?: unknown;
        context?: unknown;
      };

    if (
      typeof candidate.context ===
      "object" &&
      candidate.context !== null
    ) {
      const context =
        candidate.context as {
          status?: unknown;
          statusText?: unknown;
        };

      const status =
        typeof context.status === "number"
          ? `HTTP ${context.status}`
          : "";

      const statusText =
        typeof context.statusText === "string"
          ? context.statusText
          : "";

      if (status || statusText) {
        return [
          status,
          statusText,
        ]
          .filter(Boolean)
          .join(" ");
      }
    }

    if (
      typeof candidate.message ===
      "string" &&
      candidate.message
    ) {
      return candidate.message;
    }
  }

  return "Unable to create workspace user.";
}


async function readFunctionErrorResponse(
  error: unknown,
): Promise<string | null> {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return null;
  }

  const candidate =
    error as {
      context?: unknown;
    };

  const context =
    candidate.context;

  if (
    !context ||
    typeof context !== "object"
  ) {
    return null;
  }

  const response =
    context as {
      clone?: () => Response;
      text?: () => Promise<string>;
    };

  try {
    if (
      typeof response.clone ===
      "function"
    ) {
      const cloned =
        response.clone();

      if (
        typeof cloned.text ===
        "function"
      ) {
        const text =
          await cloned.text();

        if (text.trim()) {
          return text;
        }
      }
    }

    if (
      typeof response.text ===
      "function"
    ) {
      const text =
        await response.text();

      if (text.trim()) {
        return text;
      }
    }
  } catch {
    // Ignore response parsing errors.
  }

  return null;
}


export async function createWorkspaceUser(
  input: CreateWorkspaceUserInput,
): Promise<CreateWorkspaceUserResult> {
  const email =
    input.email
      .trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Email is required.",
    );
  }

  if (email.length > 320) {
    throw new Error(
      "Email address is too long.",
    );
  }

  const role =
    input.role;

  if (
    ![
      "ADMIN",
      "MANAGER",
      "STAFF",
    ].includes(role)
  ) {
    throw new Error(
      "Invalid user role.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "create-workspace-user",
      {
        body: {
          email,
          role,
        },
      },
    );

  if (error) {
    const responseBody =
      await readFunctionErrorResponse(
        error,
      );

    console.error(
      "create-workspace-user failed:",
      {
        error,
        responseBody,
      },
    );

    let message =
      extractFunctionErrorMessage(
        error,
      );

    if (responseBody) {
      try {
        const parsed =
          JSON.parse(
            responseBody,
          ) as {
            error?: unknown;
          };

        if (
          typeof parsed.error ===
          "string" &&
          parsed.error
        ) {
          message =
            parsed.error;
        } else {
          message =
            responseBody;
        }
      } catch {
        message =
          responseBody;
      }
    }

    throw new Error(
      message ||
        "Unable to create workspace user.",
    );
  }

  if (!data) {
    throw new Error(
      "The server returned an empty response.",
    );
  }

  if (!data.success) {
    throw new Error(
      data.error ||
        "Unable to create workspace user.",
    );
  }

  if (
    typeof data.temporaryPassword !==
      "string" ||
    !data.temporaryPassword
  ) {
    throw new Error(
      "User was created but temporary password was not returned.",
    );
  }

  if (
    !data.user ||
    typeof data.user.id !==
      "string" ||
    typeof data.user.email !==
      "string" ||
    typeof data.user.role !==
      "string"
  ) {
    throw new Error(
      "The server returned an invalid user response.",
    );
  }

  return data as CreateWorkspaceUserResult;
}