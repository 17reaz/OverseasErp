import type { PassportOcrCloudAdapter } from "./passport-ocr-cloud-contract";

function notConfigured(): never {
  throw new Error(
    "Passport cloud OCR is not configured yet. " +
      "The existing local OCR remains available.",
  );
}

export const passportOcrCloudAdapter: PassportOcrCloudAdapter = {
  async createUploadTarget() {
    return notConfigured();
  },

  async createJob() {
    return notConfigured();
  },

  async getJobResult() {
    return notConfigured();
  },
};