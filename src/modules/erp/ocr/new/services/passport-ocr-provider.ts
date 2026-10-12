import type { PassportOcrProvider } from "./passport-ocr-contract";
import { localPassportOcrAdapter } from "./passport-ocr-local-adapter";

/**
 * Default provider: existing browser-based OCR.
 *
 * Later, replace this adapter with an AWS-backed provider
 * without changing the Candidate Registration page.
 */
const passportOcrProvider: PassportOcrProvider =
  localPassportOcrAdapter;

export function readPassportDocument(
  file: File,
  onProgress?: (progress: number) => void,
) {
  return passportOcrProvider.readPassport(file, onProgress);
}