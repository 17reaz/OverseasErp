
import { createWorker } from "tesseract.js";
import type { PassportOcrResult } from "../types/passport-ocr-types";

function cleanMrzLine(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, "")
    .replace(/«/g, "<");
}

function toIsoDate(value: string, kind: "birth" | "expiry") {
  if (!/^\d{6}$/.test(value)) return "";

  const yy = Number(value.slice(0, 2));
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);
  const currentYear = new Date().getFullYear() % 100;

  let year: number;

  if (kind === "birth") {
    year = yy > currentYear ? 1900 + yy : 2000 + yy;
  } else {
    year = yy >= 70 ? 1900 + yy : 2000 + yy;
  }

  return `${year}-${month}-${day}`;
}

function parseMrz(text: string, confidence: number): PassportOcrResult {
  const lines = text
    .split(/\r?\n/)
    .map(cleanMrzLine)
    .filter((line) => line.length >= 30);

  // Standard passport MRZ (TD3) uses two lines of 44 characters.
  let line1 = "";
  let line2 = "";

  for (let i = 0; i < lines.length - 1; i++) {
    if (
      lines[i].startsWith("P<") &&
      lines[i + 1].length >= 28
    ) {
      line1 = lines[i].padEnd(44, "<").slice(0, 44);
      line2 = lines[i + 1].padEnd(44, "<").slice(0, 44);
      break;
    }
  }

  if (!line1 || !line2) {
    throw new Error(
      "Passport-এর নিচের MRZ লাইন পড়া যায়নি। পরিষ্কার, সোজা Passport image দিয়ে আবার চেষ্টা করো।",
    );
  }

  const namePart = line1.slice(5).split("<<");
  const surname = (namePart[0] ?? "").replace(/</g, " ").trim();
  const givenNames = (namePart[1] ?? "")
    .replace(/</g, " ")
    .trim();

  const passportNo = line2.slice(0, 9).replace(/</g, "").trim();
  const nationality = line2.slice(10, 13).replace(/</g, "").trim();
  const dateOfBirth = toIsoDate(line2.slice(13, 19), "birth");
  const sexCode = line2.slice(20, 21);
  const expiryDate = toIsoDate(line2.slice(21, 27), "expiry");

  if (!passportNo || !surname) {
    throw new Error(
      "Passport number বা নাম নির্ভরযোগ্যভাবে পাওয়া যায়নি। ছবি আবার upload করো।",
    );
  }

  return {
    name: [givenNames, surname].filter(Boolean).join(" ").trim(),
    passportNo,
    nationality,
    dateOfBirth,
    sex:
      sexCode === "M" ? "Male" : sexCode === "F" ? "Female" : "",
    expiryDate,
    confidence: Math.round(confidence),
    rawText: text,
  };
}

export async function readPassport(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<PassportOcrResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "এখন Passport OCR-এর জন্য JPG, PNG বা অন্য image file ব্যবহার করো। PDF support পরে যোগ করব।",
    );
  }

  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

  try {
    worker = await createWorker("eng", 1, {
      logger: (message) => {
        if (message.status === "recognizing text") {
          onProgress?.(Math.round(message.progress * 90) + 10);
        }
      },
    });

    onProgress?.(5);

    const result = await worker.recognize(file);
    onProgress?.(95);

    const parsed = parseMrz(result.data.text, result.data.confidence);
    onProgress?.(100);

    return parsed;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
