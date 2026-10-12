import type { PassportOcrResult } from "../types/passport-ocr-types";

export type PassportOcrProgress = (progress: number) => void;

export type PassportOcrProvider = {
  readPassport(
    file: File,
    onProgress?: PassportOcrProgress,
  ): Promise<PassportOcrResult>;
};