import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import { supabaseAdmin } from "./supabase"

const region = process.env.AWS_REGION
const bucket = process.env.AWS_S3_BUCKET
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET

if (!region) {
  throw new Error("Missing AWS_REGION environment variable")
}

if (!bucket) {
  throw new Error("Missing AWS_S3_BUCKET environment variable")
}

if (!accessKeyId) {
  throw new Error("Missing AWS_ACCESS_KEY_ID environment variable")
}

if (!secretAccessKey) {
  throw new Error(
    "Missing AWS_SECRET_ACCESS_KEY environment variable",
  )
}

if (!supabaseStorageBucket) {
  throw new Error(
    "Missing SUPABASE_STORAGE_BUCKET environment variable",
  )
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export async function copySupabaseFileToS3(input: {
  fileLocation: string
  s3Key: string
}) {
  const { data, error } = await supabaseAdmin.storage
    .from(supabaseStorageBucket)
    .download(input.fileLocation)

  if (error) {
    throw new Error(
      `Failed to download file from Supabase Storage: ${error.message}`,
    )
  }

  if (!data) {
    throw new Error(
      "Supabase Storage returned no file data",
    )
  }

  const arrayBuffer = await data.arrayBuffer()

  const body = new Uint8Array(arrayBuffer)

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.s3Key,
      Body: body,
      ContentType:
        data.type || "application/octet-stream",
    }),
  )

  return {
    bucket,
    key: input.s3Key,
    contentType:
      data.type || "application/octet-stream",
    size: body.byteLength,
  }
}