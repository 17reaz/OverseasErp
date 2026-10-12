
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication required" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");

    if (!url || !key) {
      return respond({ error: "Service is not configured" }, 503);
    }

    const supabase = createClient(url, key, {
      global: { headers: { Authorization: authorization } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const token = authorization.slice("Bearer ".length);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return respond({ error: "Invalid session" }, 401);
    }

    const body = await req.json();
    const jobId =
      typeof body.jobId === "string" ? body.jobId : "";
    const objectKey =
      typeof body.objectKey === "string" ? body.objectKey : "";

    if (!jobId || !objectKey) {
      return respond({ error: "jobId and objectKey are required" }, 400);
    }

    const { data, error } = await supabase
      .from("passport_ocr_jobs")
      .update({
        status: "uploaded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("object_key", objectKey)
      .eq("user_id", user.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Job update failed:", error.message);
      return respond({ error: "Could not update upload status" }, 500);
    }

    if (!data) {
      return respond(
        { error: "OCR job not found or already updated" },
        404,
      );
    }

    return respond({ success: true, jobId, status: "uploaded" });
  } catch (error) {
    console.error("Mark uploaded error:", error);
    return respond({ error: "Could not update OCR job" }, 500);
  }
});
