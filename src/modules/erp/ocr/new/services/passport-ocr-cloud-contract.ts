import type { PassportOcrResult } from "../types/passport-ocr-types";

export type PassportOcrJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type PassportUploadTarget = {
  uploadUrl: string;
  objectKey: string;
  expiresAt?: string;
  headers?: Record<string, string>;
};

export type PassportOcrJob = {
  jobId: string;
  status: PassportOcrJobStatus;
};

export type PassportOcrJobResult =
  | {
      status: "completed";
      result: PassportOcrResult;
    }
  | {
      status: "queued" | "processing";
    }
  | {
      status: "failed";
      message: string;
    };

export type PassportOcrCloudAdapter = {
  createUploadTarget(input: {
    fileName: string;
    contentType: string;
    fileSize: number;
  }): Promise<PassportUploadTarget>;

  createJob(input: {
    objectKey: string;
  }): Promise<PassportOcrJob>;

  getJobResult(input: {
    jobId: string;
  }): Promise<PassportOcrJobResult>;
};