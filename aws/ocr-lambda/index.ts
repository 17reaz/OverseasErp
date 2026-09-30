import {
  GetDocumentTextDetectionCommand,
  StartDocumentTextDetectionCommand,
  TextractClient,
} from "@aws-sdk/client-textract"
import type { S3Event, S3Handler } from "aws-lambda"

import { createClient } from "@supabase/supabase-js"

const region = process.env.AWS_REGION
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!region) {
  throw new Error("Missing AWS_REGION")
}

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL")
}

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
}

const textract = new TextractClient({
  region,
})

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

function decodeS3Key(key: string) {
  return decodeURIComponent(key.replace(/\+/g, " "))
}

function extractOcrJobId(key: string) {
  const fileName = key.split("/").pop()

  if (!fileName) {
    return null
  }

  const match = fileName.match(/^([0-9a-f-]{36})-/i)

  return match?.[1] ?? null
}

async function startTextract(
  bucket: string,
  key: string,
  jobId: string,
) {
  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
  })

  const result = await textract.send(command)

  if (!result.JobId) {
    throw new Error("Textract did not return a JobId")
  }

  const { error } = await supabase
    .from("ocr_jobs")
    .update({
      status: "processing",
      textract_job_id: result.JobId,
      s3_bucket: bucket,
      s3_key: key,
    })
    .eq("id", jobId)

  if (error) {
    throw new Error(
      `Failed to save Textract job ID: ${error.message}`,
    )
  }

  console.log("[OCR] Textract started", {
    ocrJobId: jobId,
    textractJobId: result.JobId,
  })
}

async function processTextractResult(
  textractJobId: string,
) {
  let nextToken: string | undefined
  const blocks: unknown[] = []

  do {
    const command = new GetDocumentTextDetectionCommand({
      JobId: textractJobId,
      NextToken: nextToken,
    })

    const response = await textract.send(command)

    if (response.Blocks) {
      blocks.push(...response.Blocks)
    }

    nextToken = response.NextToken
  } while (nextToken)

  const lines = blocks
    .filter(
      (
        block,
      ): block is {
        BlockType?: string
        Text?: string
      } =>
        typeof block === "object" &&
        block !== null &&
        "BlockType" in block &&
        "Text" in block,
    )
    .filter(
      (block) =>
        block.BlockType === "LINE" &&
        typeof block.Text === "string",
    )
    .map((block) => block.Text!)

  const text = lines.join("\n")

  return {
    text,
    lines,
    blocks,
    processedAt: new Date().toISOString(),
  }
}

async function handleS3Event(event: S3Event) {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name

    const key = decodeS3Key(
      record.s3.object.key,
    )

    const jobId = extractOcrJobId(key)

    if (!jobId) {
      console.error(
        "[OCR] Could not extract OCR job ID",
        key,
      )

      continue
    }

    const { data: job, error: jobError } =
      await supabase
        .from("ocr_jobs")
        .select(
          "id, status, textract_job_id",
        )
        .eq("id", jobId)
        .maybeSingle()

    if (jobError) {
      throw new Error(
        `Failed to load OCR job: ${jobError.message}`,
      )
    }

    if (!job) {
      console.error(
        "[OCR] OCR job not found",
        jobId,
      )

      continue
    }

    if (job.textract_job_id) {
      console.log(
        "[OCR] Textract already started",
        job.textract_job_id,
      )

      continue
    }

    await startTextract(
      bucket,
      key,
      jobId,
    )
  }
}

export const handler: S3Handler = async (
  event,
) => {
  console.log(
    "[OCR] Lambda event",
    JSON.stringify(event),
  )

  await handleS3Event(event)
}