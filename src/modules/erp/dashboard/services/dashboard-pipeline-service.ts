import type { DashboardCandidate } from "../dashboard-service";

function normalizeStage(stage: string | null): string {
  return (
    stage
      ?.toLowerCase()
      .trim()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ") ?? ""
  );
}

export function getDashboardPipeline(
  processingCandidates: DashboardCandidate[],
  bmetCandidateIds: Set<string>,
) {
  const pipelineCounts = {
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
    const stage = normalizeStage(candidate.current_stage);

    // One candidate belongs to ONE pipeline stage only.
    // Never count the same candidate in multiple stages.
    switch (stage) {
      case "medical":
        pipelineCounts.medical += 1;
        break;

      case "mofa":
        pipelineCounts.mofa += 1;
        break;

      case "finger":
        pipelineCounts.finger += 1;
        break;

      case "police clearance":
        pipelineCounts.police_clearance += 1;
        break;

      case "takamul":
        pipelineCounts.takamul += 1;
        break;

      case "visa":
        pipelineCounts.visa += 1;
        break;

      case "bmet":
        pipelineCounts.bmet += 1;
        break;

      case "flight":
        pipelineCounts.flight += 1;
        break;

      case "iqama":
        pipelineCounts.iqama += 1;
        break;

      default: {
        // BMET can exist outside current_stage.
        // Only use this fallback when current_stage does not
        // already identify another pipeline stage.
        if (bmetCandidateIds.has(candidate.id)) {
          pipelineCounts.bmet += 1;
          break;
        }

        // Iqama can also be represented through requested_services.
        // It is only checked as a fallback, so the candidate is
        // still counted in one stage only.
        const requestedServices =
          candidate.requested_services as
            | Record<string, unknown>
            | null
            | undefined;

        if (requestedServices?.iqama === true) {
          pipelineCounts.iqama += 1;
        }

        break;
      }
    }
  }

  return [
    {
      key: "active" as const,
      label: "Active",
      value: processingCandidates.length,
    },
    {
      key: "medical" as const,
      label: "Medical",
      value: pipelineCounts.medical,
    },
    {
      key: "mofa" as const,
      label: "MOFA",
      value: pipelineCounts.mofa,
    },
    {
      key: "finger" as const,
      label: "Finger",
      value: pipelineCounts.finger,
    },
    {
      key: "police_clearance" as const,
      label: "Police Clearance",
      value: pipelineCounts.police_clearance,
    },
    {
      key: "takamul" as const,
      label: "Takamul",
      value: pipelineCounts.takamul,
    },
    {
      key: "visa" as const,
      label: "Visa",
      value: pipelineCounts.visa,
    },
    {
      key: "bmet" as const,
      label: "BMET",
      value: pipelineCounts.bmet,
    },
    {
      key: "flight" as const,
      label: "Flight",
      value: pipelineCounts.flight,
    },
    {
      key: "iqama" as const,
      label: "Iqama",
      value: pipelineCounts.iqama,
    },
  ];
}
