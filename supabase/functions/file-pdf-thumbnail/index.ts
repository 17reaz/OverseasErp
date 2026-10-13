
import { createClient } from "npm:@supabase/supabase-js@2";
import * as pdfjsLib from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

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

  let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | undefined;

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return respond(
        { error: "Edge Function environment is not configured" },
        503,
      );
    }

    // Validate the logged-in user.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
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
    const fileId = Number(body.fileId);

    if (!Number.isSafeInteger(fileId) || fileId <= 0) {
      return respond({ error: "Valid fileId is required" }, 400);
    }

    // Respect the user's existing files-table RLS policies.
    const { data: file, error: fileError } = await userClient
      .from("files")
      .select("id, tenant_id, file_location, thumbnail_location")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError) {
      console.error("File lookup failed:", fileError.message);
      return respond({ error: "Could not read file record" }, 500);
    }

    if (!file) {
      return respond({ error: "File not found or access denied" }, 404);
    }

    if (!file.file_location.toLowerCase().endsWith(".pdf")) {
      return respond({ error: "This file is not a PDF" }, 415);
    }

    // Server-side client: never expose this key to the frontend.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Return the existing thumbnail if one is already available.
    if (file.thumbnail_location) {
      const { data: cached } = await admin.storage
        .from("file-thumbnails")
        .createSignedUrl(file.thumbnail_location, 3600);

      if (cached?.signedUrl) {
        return respond({
          success: true,
          fileId,
          thumbnailPath: file.thumbnail_location,
          thumbnailUrl: cached.signedUrl,
          cached: true,
        });
      }
    }

    // Download the original without moving or modifying it.
    const { data: original, error: downloadError } =
      await userClient.storage
        .from("passports")
        .download(file.file_location);

    if (downloadError || !original) {
      console.error("Original download failed:", downloadError?.message);
      return respond(
        { error: "Could not download the original PDF" },
        502,
      );
    }

    if (original.size > 20 * 1024 * 1024) {
      return respond(
        { error: "PDF exceeds the 20 MB thumbnail limit" },
        413,
      );
    }

    const pdfBytes = new Uint8Array(await original.arrayBuffer());

    loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Render a small first-page preview.
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

    if (jpeg.size > 2 * 1024 * 1024) {
      return respond(
        { error: "Generated thumbnail exceeds the 2 MB limit" },
        413,
      );
    }

    const thumbnailPath = `${file.tenant_id}/${file.id}.jpg`;

    // Save the thumbnail in its own private bucket.
    const { error: uploadError } = await admin.storage
      .from("file-thumbnails")
      .upload(thumbnailPath, jpeg, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Thumbnail upload failed:", uploadError.message);
      return respond({ error: "Could not save thumbnail" }, 502);
    }

    // Store only the object path in the database.
    const { error: updateError } = await admin
      .from("files")
      .update({ thumbnail_location: thumbnailPath })
      .eq("id", file.id)
      .eq("tenant_id", file.tenant_id);

    if (updateError) {
      console.error("Thumbnail path update failed:", updateError.message);
      return respond(
        { error: "Thumbnail saved, but database update failed" },
        502,
      );
    }

    const { data: signed, error: signedError } = await admin.storage
      .from("file-thumbnails")
      .createSignedUrl(thumbnailPath, 3600);

    if (signedError || !signed?.signedUrl) {
      return respond(
        { error: "Thumbnail generated, but signed URL creation failed" },
        502,
      );
    }

    return respond({
      success: true,
      fileId,
      thumbnailPath,
      thumbnailUrl: signed.signedUrl,
      cached: false,
    });
  } catch (error) {
    console.error("PDF thumbnail generation failed:", error);

    return respond({
      error: "Thumbnail generation failed. The original file is unchanged.",
    }, 500);
  } finally {
    if (loadingTask) {
      await loadingTask.destroy().catch(() => {});
    }
  }
});
