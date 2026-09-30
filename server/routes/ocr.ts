import { Hono } from "hono"

import { authMiddleware } from "../middleware/auth"
import {
  createOcrJob,
  getFileById,
  updateOcrJob,
} from "../services/supabase"
import { copySupabaseFileToS3 } from "../services/s3"

const ocr = new Hono()

ocr.use("*", authMiddleware)

type CreateOcrJobBody = {
  fileId?: number
  candidateId?: string | null
}

ocr.post("/jobs", async (c) => {
  let jobId: string | null = null

  try {
    const auth = c.get("auth")

    const body = await c.req.json<CreateOcrJobBody>()

    const fileId = Number(body.fileId)

    if (!Number.isInteger(fileId) || fileId <= 0) {
      return c.json(
        {
          ok: false,
          error: {
            code: "INVALID_FILE_ID",
            message: "A valid fileId is required",
          },
        },
        400,
      )
    }

    const file = await getFileById(fileId)

    if (!file) {
      return c.json(
        {
          ok: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "File not found",
          },
        },
        404,
      )
    }

    if (file.tenant_id !== auth.tenantId) {
      return c.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have access to this file",
          },
        },
        403,
      )
    }

    const job = await createOcrJob({
      tenantId: auth.tenantId,
      fileId: file.id,
      candidateId: body.candidateId ?? file.candidate_id ?? null,
    })

    jobId = job.id

    await updateOcrJob(job.id, {
      status: "uploading",
      started_at: new Date().toISOString(),
    })

    const fileName = file.file_location.split("/").pop()

    if (!fileName) {
      throw new Error("Unable to determine source file name")
    }

    const s3Key = [
      "ocr",
      auth.tenantId,
      file.candidate_id ?? "unknown-candidate",
      `${job.id}-${fileName}`,
    ].join("/")

    const uploaded = await copySupabaseFileToS3({
      fileLocation: file.file_location,
      s3Key,
    })

    const completedJob = await updateOcrJob(job.id, {
      status: "processing",
      s3_bucket: uploaded.bucket,
      s3_key: uploaded.key,
    })

    return c.json(
      {
        ok: true,
        data: completedJob,
      },
      201,
    )
  } catch (error) {
    console.error("[OCR JOB CREATE ERROR]", error)

    if (jobId) {
      try {
        await updateOcrJob(jobId, {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload file for OCR",
          completed_at: new Date().toISOString(),
        })
      } catch (updateError) {
        console.error(
          "[OCR JOB FAILURE UPDATE ERROR]",
          updateError,
        )
      }
    }

    return c.json(
      {
        ok: false,
        error: {
          code: "OCR_JOB_CREATE_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create OCR job",
        },
      },
      500,
    )
  }
})

export default ocr