
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  S3Client,
  PutObjectCommand,
} from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
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
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const region = Deno.env.get("AWS_REGION");
    const bucket = Deno.env.get("AWS_S3_BUCKET");
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !region ||
      !bucket ||
      !accessKeyId ||
      !secretAccessKey
    ) {
      return jsonResponse(
        { error: "Passport upload service is not configured" },
        503,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
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
      return jsonResponse({ error: "Invalid session" }, 401);
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const fileName =
      typeof body.fileName === "string" ? body.fileName.trim() : "";
    const contentType =
      typeof body.contentType === "string" ? body.contentType : "";
    const fileSize = Number(body.fileSize);

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);

    if (!fileName) {
      return jsonResponse({ error: "File name is required" }, 400);
    }

    if (!allowedTypes.has(contentType)) {
      return jsonResponse({ error: "Unsupported file type" }, 400);
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > 15 * 1024 * 1024
    ) {
      return jsonResponse(
        { error: "File must be smaller than or equal to 15 MB" },
        400,
      );
    }

    const safeName =
      fileName
        .split(/[\\/]/)
        .pop()!
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-100) || "passport";

    const jobId = crypto.randomUUID();
    const objectKey =
      `passport-ocr/${user.id}/${jobId}/${safeName}`;

    // Create the job before issuing the upload URL.
    const { error: insertError } = await supabase
      .from("passport_ocr_jobs")
      .insert({
        id: jobId,
        user_id: user.id,
        object_key: objectKey,
        status: "queued",
      });

    if (insertError) {
      console.error("Could not create OCR job:", insertError.message);
      return jsonResponse(
        { error: "Could not create passport OCR job" },
        500,
      );
    }

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const expiresIn = 300;
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

    return jsonResponse({
      jobId,
      uploadUrl,
      objectKey,
      expiresAt: new Date(
        Date.now() + expiresIn * 1000,
      ).toISOString(),
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("Passport upload URL error:", error);
    return jsonResponse(
      { error: "Unable to prepare passport upload" },
      500,
    );
  }
});
