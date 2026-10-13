import type { ExistingCandidateInfo } from "../candidate-service";

export type DocType = "passport" | "medical" | "mofa" | "visa";

export type OcrField = {
  label: string;
  value: string;
};

export type ScanState = {
  status: "idle" | "scanning" | "done";
  progress: number;
  fileName?: string;
  fileSize?: number;
  confidence?: number;
  fields?: OcrField[];
};

export type ScanBase = { fileName: string; fileSize: number };

export type MofaCrossCheck = {
  passportNoMatches: boolean;
  nameMatches: boolean;
};

export type ResolvedCandidate = {
  info: ExistingCandidateInfo;
  created: boolean;
};
