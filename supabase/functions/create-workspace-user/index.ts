
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  resolveCaller,
  UnauthorizedError,
} from "../_shared/tenant.ts";

const ALLOWED_ROLES = new Set([
  "ADMIN",
  "MANAGER",
  "STAFF",
]);

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

function generateTemporaryPassword(length = 16): string {
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += PASSWORD_ALPHABET[
      values[index] % PASSWORD_ALPHABET.length
    ];
  }

  return password;
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function normalizeRole(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toUpperCase();
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Unknown error.";
}

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const value = error as Record<string, unknown>;

  return {
    message:
      typeof value.message === "string"
        ? value.message
        : null,
    code:
      typeof value.code === "string"
        ? value.code
        : null,
    details:
      typeof value.details === "string"
        ? value.details
        : null,
    hint:
      typeof value.hint === "string"
        ? value.hint
        : null,
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCorsPreflight(req);

  if (corsResponse) {
    return corsResponse;
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed.",
      },
      405,
    );
  }

  let stage = "initialization";

  try {
    // ----------------------------------------------------------
    // 1. Resolve caller
    // ----------------------------------------------------------

    stage = "resolve-caller";

    const caller = await resolveCaller(req);

    console.log("create-workspace-user caller resolved:", {
      userId: caller.userId,
      tenantId: caller.tenantId,
      role: caller.role,
    });

    // ----------------------------------------------------------
    // 2. Authorization
    // ----------------------------------------------------------

    stage = "authorization";

    if (
      caller.role !== "OWNER" &&
      caller.role !== "ADMIN"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Only OWNER or ADMIN users can create workspace users.",
        },
        403,
      );
    }

    // ----------------------------------------------------------
    // 3. Parse request
    // ----------------------------------------------------------

    stage = "parse-request";

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        400,
      );
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Request body must be an object.",
        },
        400,
      );
    }

    const payload = body as Record<string, unknown>;

    const email = normalizeEmail(payload.email);
    const role = normalizeRole(payload.role);

    // ----------------------------------------------------------
    // 4. Validate input
    // ----------------------------------------------------------

    stage = "validate-input";

    if (!email) {
      return jsonResponse(
        {
          success: false,
          error: "Email is required.",
        },
        400,
      );
    }

    if (email.length > 320) {
      return jsonResponse(
        {
          success: false,
          error: "Email address is too long.",
        },
        400,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(
        {
          success: false,
          error: "Please provide a valid email address.",
        },
        400,
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid role. Allowed roles: ADMIN, MANAGER, STAFF.",
        },
        400,
      );
    }

    // ----------------------------------------------------------
    // 5. Generate temporary password
    // ----------------------------------------------------------

    stage = "generate-password";

    const temporaryPassword =
      generateTemporaryPassword();

    // ----------------------------------------------------------
    // 6. Create Supabase Auth user
    // ----------------------------------------------------------

    stage = "create-auth-user";

    const {
      data: createdUserData,
      error: createUserError,
    } =
      await caller.adminClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,

        app_metadata: {
          provisioned_by_admin: true,
        },
      });

    if (
      createUserError ||
      !createdUserData.user
    ) {
      console.error(
        "create-workspace-user auth.admin.createUser failed:",
        getErrorDetails(createUserError),
      );

      const message = getErrorMessage(createUserError);

      const normalizedMessage =
        message.toLowerCase();

      if (
        normalizedMessage.includes("already registered") ||
        normalizedMessage.includes("already exists") ||
        normalizedMessage.includes("duplicate")
      ) {
        return jsonResponse(
          {
            success: false,
            stage,
            error:
              "A user with this email address already exists.",
          },
          409,
        );
      }

      return jsonResponse(
        {
          success: false,
          stage,
          error:
            "Unable to create the authentication account.",
        },
        500,
      );
    }

    const newUser = createdUserData.user;

    console.log(
      "create-workspace-user Auth user created:",
      {
        userId: newUser.id,
        email: newUser.email,
      },
    );

    // ----------------------------------------------------------
    // 7. Create profile
    // ----------------------------------------------------------

    stage = "create-profile";

    const { error: profileError } =
      await caller.adminClient
        .from("profiles")
        .insert({
          id: newUser.id,
          tenant_id: caller.tenantId,
          full_name: email.split("@")[0],
          role,
          is_active: true,
        });

    if (profileError) {
      console.error(
        "create-workspace-user profile insert failed:",
        getErrorDetails(profileError),
      );

      await caller.adminClient.auth.admin.deleteUser(
        newUser.id,
      );

      return jsonResponse(
        {
          success: false,
          stage,
          error:
            "User authentication was created, but the workspace profile could not be created.",
        },
        500,
      );
    }

    console.log(
      "create-workspace-user profile created:",
      {
        userId: newUser.id,
        tenantId: caller.tenantId,
        role,
      },
    );

    // ----------------------------------------------------------
    // 8. Create tenant membership
    // ----------------------------------------------------------

    stage = "create-membership";

    const { error: membershipError } =
      await caller.adminClient
        .from("tenant_members")
        .insert({
          tenant_id: caller.tenantId,
          user_id: newUser.id,
          role,
          is_active: true,
        });

    if (membershipError) {
      console.error(
        "create-workspace-user tenant_members insert failed:",
        getErrorDetails(membershipError),
      );

      // Roll back profile.
      await caller.adminClient
        .from("profiles")
        .delete()
        .eq("id", newUser.id)
        .eq("tenant_id", caller.tenantId);

      // Roll back Auth user.
      await caller.adminClient.auth.admin.deleteUser(
        newUser.id,
      );

      return jsonResponse(
        {
          success: false,
          stage,
          error:
            "User authentication and profile were created, but workspace membership could not be created.",
        },
        500,
      );
    }

    console.log(
      "create-workspace-user membership created:",
      {
        userId: newUser.id,
        tenantId: caller.tenantId,
        role,
      },
    );

    // ----------------------------------------------------------
    // 9. SUCCESS
    // ----------------------------------------------------------

    return jsonResponse(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role,
        },
        temporaryPassword,
      },
      201,
    );
  } catch (error) {
    console.error(
      "create-workspace-user unexpected error:",
      {
        stage,
        error: getErrorDetails(error),
      },
    );

    if (error instanceof UnauthorizedError) {
      return jsonResponse(
        {
          success: false,
          stage,
          error: error.message,
        },
        401,
      );
    }

    return jsonResponse(
      {
        success: false,
        stage,
        error: "Internal server error.",
      },
      500,
    );
  }
});
