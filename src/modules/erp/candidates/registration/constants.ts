import { FileCheck, Stethoscope, UserRound } from "lucide-react";
import type { ScanState } from "./types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const NOT_DETECTED = "Not detected";

export const countries = [
  "Saudi Arabia",
  "Mauritius",
  "Laos",
  "Malaysia",
  "Belarus",
  "Fiji",
  "UAE",
] as const;

export const steps = [
  {
    id: 1,
    title: "Candidate",
    description: "Basic information",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Medical",
    description: "Medical registration",
    icon: Stethoscope,
  },
  {
    id: 3,
    title: "MOFA",
    description: "MOFA registration",
    icon: FileCheck,
  },
  {
    id: 4,
    title: "Visa",
    description: "Visa registration",
    icon: FileCheck,
  },
] as const;

export const idleScan: ScanState = { status: "idle", progress: 0 };
