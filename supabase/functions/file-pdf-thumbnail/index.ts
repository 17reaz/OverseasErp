
import { createClient } from "npm:@supabase/supabase-js@2";
// import * as pdfjsLib from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


const THUMBNAIL_BUCKET = "file-thumbnails";
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

type FileRow = {
  id: number;
  tenant_id: string;
  doc_type: string;
  file_location: string;
  thumbnail_location: string | null;
};

async function generateThumbnail(
  admin: ReturnType<typeof createClient>,
  file: FileRow,
) {
  let loadingTask:
    | ReturnType<typeof pdfjsLib.getDocument>
    | undefined;

  try {
    if (!file.file_location?.toLowerCase().endsWith(".pdf")) {
      return {
        fileId: file.id,
        success: false,
        error: "Not a PDF",
      };
    }

    // Return cached thumbnail when it already exists.
    if (file.thumbnail_location) {
      const { data: cached } = await admin.storage
        .from(THUMBNAIL_BUCKET)
        .createSignedUrl(file.thumbnail_location, 3600);

      if (cached?.signedUrl) {
        return {
          fileId: file.id,
          success: true,
          cached: true,
          thumbnailUrl: cached.signedUrl,
        };
      }
    }

    // Download original PDF without modifying it.
    const { data: original, error: downloadError } =
  await admin.storage
    .from(getSourceBucket(file.doc_type))
    .download(file.file_location);

    if (downloadError || !original) {
      throw new Error(
        `Original PDF download failed: ${downloadError?.message ?? "No file returned"}`,
      );
    }

    if (original.size > MAX_PDF_BYTES) {
      throw new Error("PDF exceeds the 20 MB processing limit");
    }

    const pdfBytes = new Uint8Array(await original.arrayBuffer());

    loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, 480 / baseViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = new OffscreenCanvas(
      Math.max(1, Math.ceil(viewport.width)),
      Math.max(1, Math.ceil(viewport.height)),
    );

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("OffscreenCanvas 2D context is unavailable");
    }

    await page.render({
      canvasContext: context as never,
      viewport,
    }).promise;

    const jpeg = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.78,
    });

    if (jpeg.size > MAX_THUMBNAIL_BYTES) {
      throw new Error("Generated thumbnail exceeds the 2 MB limit");
    }

    const thumbnailPath = `${file.tenant_id}/${file.id}.jpg`;

    const { error: uploadError } = await admin.storage
      .from(THUMBNAIL_BUCKET)
      .upload(thumbnailPath, jpeg, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
    }

    const { error: updateError } = await admin
      .from("files")
      .update({ thumbnail_location: thumbnailPath })
      .eq("id", file.id)
      .eq("tenant_id", file.tenant_id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(THUMBNAIL_BUCKET)
      .createSignedUrl(thumbnailPath, 3600);

    if (signedError || !signed?.signedUrl) {
      throw new Error("Could not create thumbnail signed URL");
    }

    return {
      fileId: file.id,
      success: true,
      cached: false,
      thumbnailPath,
      thumbnailUrl: signed.signedUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`Thumbnail generation failed for file ${file.id}:`, message);

    return {
      fileId: file.id,
      success: false,
      error: message,
    };
  } finally {
    if (loadingTask) {
      await loadingTask.destroy().catch(() => {});
    }
  }
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return respond({ error: "Function environment is not configured" }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authorization.slice("Bearer ".length);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(token);

    if (authError || !user) {
      return respond({ error: "Invalid session" }, 401);
    }

    const body = await req.json().catch(() => ({}));

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Determine the logged-in user's tenant.
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return respond({ error: "Tenant not found for current user" }, 403);
    }

    const tenantId = profile.tenant_id as string;

    // Mode 1: generate a thumbnail for one existing PDF.
    // Save browser-generated thumbnail for one existing PDF.
if (body.fileId !== undefined) {
  const fileId = Number(body.fileId);

  if (!Number.isSafeInteger(fileId) || fileId <= 0) {
    return respond({ error: "Valid fileId is required" }, 400);
  }

  if (
    typeof body.imageBase64 !== "string" ||
    !body.imageBase64
  ) {
    return respond({ error: "Thumbnail image is required" }, 400);
  }

  const { data: file, error: fileError } = await userClient
    .from("files")
    .select("id, tenant_id, file_location, thumbnail_location")
    .eq("id", fileId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (fileError) {
    return respond({ error: "Could not read file record" }, 500);
  }

  if (!file) {
    return respond({ error: "File not found or access denied" }, 404);
  }

  if (!file.file_location?.toLowerCase().endsWith(".pdf")) {
    return respond({ error: "File is not a PDF" }, 400);
  }

  // Avoid decoding an oversized payload.
  if (body.imageBase64.length > MAX_THUMBNAIL_BYTES * 1.4) {
    return respond({ error: "Thumbnail exceeds the 2 MB limit" }, 413);
  }

  let jpeg: Blob;

  try {
    const binary = atob(body.imageBase64);

    if (binary.length > MAX_THUMBNAIL_BYTES) {
      return respond({ error: "Thumbnail exceeds the 2 MB limit" }, 413);
    }

    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0),
    );

    // JPEG magic bytes: FF D8 FF
    if (
      bytes.length < 3 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff
    ) {
      return respond({ error: "Invalid JPEG image" }, 400);
    }

    jpeg = new Blob([bytes], { type: "image/jpeg" });
  } catch {
    return respond({ error: "Invalid thumbnail data" }, 400);
  }

  const thumbnailPath = `${tenantId}/${fileId}.jpg`;

  const { error: uploadError } = await admin.storage
    .from(THUMBNAIL_BUCKET)
    .upload(thumbnailPath, jpeg, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    console.error("Thumbnail upload failed:", uploadError.message);
    return respond({ error: "Could not save thumbnail" }, 500);
  }

  const { error: updateError } = await admin
    .from("files")
    .update({
      thumbnail_location: thumbnailPath,
    })
    .eq("id", fileId)
    .eq("tenant_id", tenantId);

  if (updateError) {
    console.error("Thumbnail DB update failed:", updateError.message);
    return respond({ error: "Could not update thumbnail record" }, 500);
  }

  return respond({
    success: true,
    fileId,
    thumbnailPath,
  });
}


    return respond({
      error: "Send fileId or action: generate-missing",
    }, 400);
  } catch (error) {
    console.error("file-pdf-thumbnail failed:", error);

    return respond({
      error:
        error instanceof Error
          ? error.message
          : "Unexpected thumbnail generation error",
    }, 500);
  }
});
