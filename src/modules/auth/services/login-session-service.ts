import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

interface SessionProfile {
  id: string;
  tenant_id: string;
}

interface JwtPayload {
  session_id?: string;
}

interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
  location: string;
}

function getJwtPayload(
  accessToken: string,
): JwtPayload | null {
  try {
    const parts = accessToken.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = atob(normalized);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function detectDevice(): DeviceInfo {
  const userAgent =
    navigator.userAgent.toLowerCase();

  let device = "Desktop";

  if (/tablet|ipad/.test(userAgent)) {
    device = "Tablet";
  } else if (
    /mobile|android|iphone|ipod/.test(userAgent)
  ) {
    device = "Mobile";
  }

  let browser = "Browser";

  if (userAgent.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (userAgent.includes("chrome")) {
    browser = "Google Chrome";
  } else if (userAgent.includes("firefox")) {
    browser = "Mozilla Firefox";
  } else if (
    userAgent.includes("safari") &&
    !userAgent.includes("chrome")
  ) {
    browser = "Safari";
  }

  let os = "Unknown OS";

  if (userAgent.includes("windows")) {
    os = "Windows";
  } else if (userAgent.includes("android")) {
    os = "Android";
  } else if (
    userAgent.includes("iphone") ||
    userAgent.includes("ipad")
  ) {
    os = "iOS";
  } else if (userAgent.includes("mac os")) {
    os = "macOS";
  } else if (userAgent.includes("linux")) {
    os = "Linux";
  }

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    device,
    browser,
    os,
    location: timezone || "Unknown",
  };
}

export async function createLoginSession(
  session: Session,
  profile: SessionProfile,
) {
  if (!session.access_token) {
    return {
      data: null,
      error: new Error("Missing access token"),
    };
  }

  const payload = getJwtPayload(
    session.access_token,
  );

  const sessionId = payload?.session_id;

  if (!sessionId) {
    return {
      data: null,
      error: new Error(
        "Session ID was not found in access token",
      ),
    };
  }

  const deviceInfo = detectDevice();

  const { data, error } = await supabase
    .from("login_sessions")
    .upsert(
      {
        tenant_id: profile.tenant_id,
        user_id: profile.id,
        session_id: sessionId,
        login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        logout_at: null,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location,
        is_active: true,
      },
      {
        onConflict: "session_id",
      },
    )
    .select()
    .single();

  return {
    data,
    error,
  };
}

export async function updateLoginSessionHeartbeat(
  sessionId: string,
) {
  return supabase
    .from("login_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
      is_active: true,
      logout_at: null,
    })
    .eq("session_id", sessionId);
}

export async function closeLoginSession(
  sessionId: string,
) {
  return supabase
    .from("login_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
      logout_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("session_id", sessionId);
}