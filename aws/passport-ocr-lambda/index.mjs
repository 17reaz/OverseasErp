
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

import { createClient } from "@supabase/supabase-js";

const s3 = new S3Client({});
const textract = new TextractClient({});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

function extractJobId(key) {
  const parts = key.split("/");
  if (
    parts[0] !== "passport-ocr" ||
    parts.length < 4
  ) {
    throw new Error("Invalid passport object key");
  }

  return parts[2];
}

function getText(blocks = []) {
  return blocks
    .filter((block) => block.BlockType === "LINE")
    .map((block) => block.Text ?? "")
    .filter(Boolean)
    .join("\n");
}

function parsePassportText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim().toUpperCase());

  // TD3 passport MRZ lines are usually 44 characters each.
  const mrzIndex = lines.findIndex(
    (line, index) =>
      line.startsWith("P<") &&
      line.length >= 40 &&
      lines[index + 1]?.length >= 40 &&
      lines[index + 1]?.includes("<"),
  );

  if (mrzIndex < 0) {
    return {
      name: "",
      passportNo: "",
      nationality: "",
      dateOfBirth: "",
      sex: "",
      expiryDate: "",
      confidence: 0,
      rawText,
      verified: false,
    };
  }

  const first = lines[mrzIndex].replace(/\s/g, "");
  const second = lines[mrzIndex + 1].replace(/\s/g, "");

  const names = first.slice(5).split("<<");
  const surname = (names[0] ?? "").replace(/</g, " ").trim();
  const givenNames = (names[1] ?? "").replace(/</g, " ").trim();

  const passportNo = second.slice(0, 9).replace(/</g, "");
  const nationality = second.slice(10, 13).replace(/</g, "");
  const birth = second.slice(13, 19);
  const sex = second.slice(20, 21);
  const expiry = second.slice(21, 27);

  function mrzDate(value, kind) {
    if (!/^\d{6}$/.test(value)) return "";

    const yy = Number(value.slice(0, 2));
    const mm = value.slice(2, 4);
    const dd = value.slice(4, 6);

    // DOB: choose a plausible past year; expiry: choose a plausible future year.
    const currentYY = new Date().getUTCFullYear() % 100;
    const year =
      kind === "birth"
        ? (yy > currentYY ? 1900 + yy : 2000 + yy)
        : (yy < currentYY ? 2100 + yy : 2000 + yy);

    return `${year}-${mm}-${dd}`;
  }

  return {
    name: [givenNames, surname].filter(Boolean).join(" "),
    passportNo,
    nationality,
    dateOfBirth: mrzDate(birth, "birth"),
    sex: sex === "M" ? "Male" : sex === "F" ? "Female" : "",
    expiryDate: mrzDate(expiry, "expiry"),
    confidence: 0,
    rawText,
    verified: false,
  };
}

export const handler = async (event) => {
  for (const record of event.Records ?? []) {
    let jobId;
    let objectKey;

    try {
      const bucket = record.s3.bucket.name;
      objectKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " "),
      );

      if (!objectKey.startsWith("passport-ocr/")) continue;

      jobId = extractJobId(objectKey);

      await supabase
        .from("passport_ocr_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("object_key", objectKey);

      const fileResponse = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      );

      const bytes = await fileResponse.Body.transformToByteArray();

      if (!bytes.length || bytes.length > 15 * 1024 * 1024) {
        throw new Error("File is empty or exceeds 15 MB");
      }

      const result = await textract.send(
        new DetectDocumentTextCommand({
          Document: { Bytes: bytes },
        }),
      );

      const rawText = getText(result.Blocks);
      const parsed = parsePassportText(rawText);

      const { error } = await supabase
        .from("passport_ocr_jobs")
        .update({
          status: "completed",
          result: parsed,
          error_message: null,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .eq("object_key", objectKey);

      if (error) throw error;
    } catch (error) {
      console.error("Passport OCR failed:", error);

      if (jobId) {
        await supabase
          .from("passport_ocr_jobs")
          .update({
            status: "failed",
            error_message: String(error?.message ?? "OCR failed").slice(0, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId)
          .eq("object_key", objectKey);
      }

      // Do not throw: process other records in the same S3 event.
    }
  }

  return { statusCode: 200 };
};
