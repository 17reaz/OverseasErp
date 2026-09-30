import type { Context, Next } from "hono"

import { supabaseAdmin } from "../services/supabase"

export type AuthUser = {
  id: string
  email?: string
}

export type AuthContext = {
  user: AuthUser
  tenantId: string
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authorization = c.req.header("Authorization")

    if (!authorization?.startsWith("Bearer ")) {
      return c.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authorization token",
          },
        },
        401,
      )
    }

    const token = authorization.slice("Bearer ".length).trim()

    if (!token) {
      return c.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid authorization token",
          },
        },
        401,
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return c.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired session",
          },
        },
        401,
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, tenant_id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      throw new Error(`Failed to load user profile: ${profileError.message}`)
    }

    if (!profile?.tenant_id) {
      return c.json(
        {
          ok: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: "User is not associated with a tenant",
          },
        },
        403,
      )
    }

    c.set("auth", {
      user: {
        id: user.id,
        email: user.email,
      },
      tenantId: profile.tenant_id,
    } satisfies AuthContext)

    await next()
  } catch (error) {
    console.error("[AUTH MIDDLEWARE ERROR]", error)

    return c.json(
      {
        ok: false,
        error: {
          code: "AUTH_ERROR",
          message: "Authentication failed",
        },
      },
      500,
    )
  }
}