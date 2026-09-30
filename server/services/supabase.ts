import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable")
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
}

/**
 * Server-side Supabase client.
 *
 * IMPORTANT:
 * This client uses the service-role key.
 * Never expose it to the browser/frontend.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export type OcrJobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"

export type OcrJob = {
  id: string
  tenant_id: string
  file_id: number
  candidate_id: string | null
  status: OcrJobStatus
  s3_bucket: string | null
  s3_key: string | null
  textract_job_id: string | null
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export async function getFileById(fileId: number) {
  const { data, error } = await supabaseAdmin
    .from("files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch file: ${error.message}`)
  }

  return data
}

export async function createOcrJob(input: {
  tenantId: string
  fileId: number
  candidateId?: string | null
}) {
  const { data, error } = await supabaseAdmin
    .from("ocr_jobs")
    .insert({
      tenant_id: input.tenantId,
      file_id: input.fileId,
      candidate_id: input.candidateId ?? null,
      status: "pending",
    })
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to create OCR job: ${error.message}`)
  }

  return data as OcrJob
}

export async function updateOcrJob(
  jobId: string,
  update: {
    status?: OcrJobStatus
    s3_bucket?: string | null
    s3_key?: string | null
    textract_job_id?: string | null
    result?: Record<string, unknown> | null
    error?: string | null
    started_at?: string | null
    completed_at?: string | null
  },
) {
  const { data, error } = await supabaseAdmin
    .from("ocr_jobs")
    .update(update)
    .eq("id", jobId)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to update OCR job: ${error.message}`)
  }

  return data as OcrJob
}

export async function getOcrJobById(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from("ocr_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch OCR job: ${error.message}`)
  }

  return data as OcrJob | null
}