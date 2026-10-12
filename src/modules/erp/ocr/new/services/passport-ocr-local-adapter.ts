import { readPassport } from "./passport-ocr-service";
import type { PassportOcrProvider } from "./passport-ocr-contract";

export const localPassportOcrAdapter: PassportOcrProvider = {
  readPassport(file, onProgress) {
    return readPassport(file, onProgress);
  },
};