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

  try {
    // ----------------------------------------------------------
    // Authenticate current user and resolve their tenant
    // ----------------------------------------------------------

    const caller = await resolveCaller(req);

    // ----------------------------------------------------------
    // Only OWNER / ADMIN can create users
    // ----------------------------------------------------------

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
    // Parse request
    // ----------------------------------------------------------

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
    // Validate email
    // ----------------------------------------------------------

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

    // Basic email validation.
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Please provide a valid email address.",
        },
        400,
      );
    }

    // ----------------------------------------------------------
    // Validate role
    // ----------------------------------------------------------

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
    // Generate temporary password
    // ----------------------------------------------------------

    const temporaryPassword =
      generateTemporaryPassword();

    // ----------------------------------------------------------
    // Create Auth user
    //
    // IMPORTANT:
    // app_metadata is server-controlled.
    //
    // handle_new_user() checks this flag and returns without
    // creating a tenant/profile.
    // ----------------------------------------------------------

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
      const message =
        createUserError?.message ??
        "Unable to create the user.";

      const normalizedMessage =
        message.toLowerCase();

      // Make duplicate email errors easier to understand.
      if (
        normalizedMessage.includes(
          "already registered",
        ) ||
        normalizedMessage.includes(
          "already exists",
        ) ||
        normalizedMessage.includes(
          "duplicate",
        )
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "A user with this email address already exists.",
          },
          409,
        );
      }

      console.error(
        "auth.admin.createUser failed:",
        createUserError,
      );

      return jsonResponse(
        {
          success: false,
          error: "Unable to create the user.",
        },
        500,
      );
    }

    const newUser = createdUserData.user;

    // ----------------------------------------------------------
    // Create profile
    // ----------------------------------------------------------

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
        "Profile creation failed:",
        profileError,
      );

      // Roll back Auth user.
      await caller.adminClient.auth.admin.deleteUser(
        newUser.id,
      );

      return jsonResponse(
        {
          success: false,
          error:
            "User account could not be initialized.",
        },
        500,
      );
    }

    // ----------------------------------------------------------
    // Create tenant membership
    // ----------------------------------------------------------

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
        "Tenant membership creation failed:",
        membershipError,
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
          error:
            "User could not be added to the workspace.",
        },
        500,
      );
    }

    // ----------------------------------------------------------
    // SUCCESS
    //
    // The temporary password is returned only here.
    // It is NOT stored in profiles / tenant_members / DB.
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
    if (error instanceof UnauthorizedError) {
      return jsonResponse(
        {
          success: false,
          error: error.message,
        },
        401,
      );
    }

    console.error(
      "create-workspace-user failed:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error: "Internal server error.",
      },
      500,
    );
  }
});