import type { DashboardWorkflowCandidate } from "./dashboard-stats-service";

type PipelineKey =
  | "active"
  | "medical"
  | "mofa"
  | "finger"
  | "police_clearance"
  | "takamul"
  | "visa"
  | "bmet"
  | "flight"
  | "iqama";

export interface DashboardPipelineItem {
  key: PipelineKey;
  label: string;
  value: number;
}

function normalizeStage(
  stage: string | null | undefined,
): string {
  return (
    stage
      ?.toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ") ?? ""
  );
}

function getStageKey(
  stage: string | null | undefined,
): Exclude<PipelineKey, "active"> | null {
  switch (normalizeStage(stage)) {
    case "medical":
      return "medical";

    case "mofa":
      return "mofa";

    case "finger":
      return "finger";

    case "police clearance":
      return "police_clearance";

    case "takamul":
      return "takamul";

    case "visa":
      return "visa";

    case "bmet":
      return "bmet";

    case "flight":
      return "flight";

    case "iqama":
      return "iqama";

    default:
      return null;
  }
}

/**
 * Dashboard pipeline is intentionally EXCLUSIVE.
 *
 * One processing candidate can belong to ONE stage only.
 *
 * Example:
 *
 * current_stage = "visa"
 *
 * Result:
 *   Visa +1
 *
 * It will NOT increase:
 *   Medical
 *   MOFA
 *   Finger
 *   Police Clearance
 *   Takamul
 *
 * Hold candidates are removed before this function is called.
 */
export function getDashboardPipeline(
  processingCandidates: DashboardWorkflowCandidate[],
): DashboardPipelineItem[] {
  const counts: Record<
    Exclude<PipelineKey, "active">,
    number
  > = {
    medical: 0,
    mofa: 0,
    finger: 0,
    police_clearance: 0,
    takamul: 0,
    visa: 0,
    bmet: 0,
    flight: 0,
    iqama: 0,
  };

  for (const candidate of processingCandidates) {
    const stageKey = getStageKey(
      candidate.current_stage,
    );

    /**
     * Unknown / null stage:
     * do not guess the stage from BMET/requested_services.
     *
     * current_stage is the single source of truth.
     */
    if (!stageKey) {
      continue;
    }

    /**
     * EXACTLY ONE increment.
     */
    counts[stageKey] += 1;
  }

  return [
    {
      key: "active",
      label: "Active",
      value: processingCandidates.length,
    },
    {
      key: "medical",
      label: "Medical",
      value: counts.medical,
    },
    {
      key: "mofa",
      label: "MOFA",
      value: counts.mofa,
    },
    {
      key: "finger",
      label: "Finger",
      value: counts.finger,
    },
    {
      key: "police_clearance",
      label: "Police Clearance",
      value: counts.police_clearance,
    },
    {
      key: "takamul",
      label: "Takamul",
      value: counts.takamul,
    },
    {
      key: "visa",
      label: "Visa",
      value: counts.visa,
    },
    {
      key: "bmet",
      label: "BMET",
      value: counts.bmet,
    },
    {
      key: "flight",
      label: "Flight",
      value: counts.flight,
    },
    {
      key: "iqama",
      label: "Iqama",
      value: counts.iqama,
    },
  ];
}