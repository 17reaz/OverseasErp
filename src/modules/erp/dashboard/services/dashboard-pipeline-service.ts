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

    case "flight":
      pipelineCounts.flight += 1;
      break;
  }

  // BMET is handled separately because it is not
  // necessarily represented by current_stage.
  if (bmetCandidateIds.has(candidate.id)) {
    pipelineCounts.bmet += 1;
  }

  // Iqama is service-based, not current_stage-based.
  const requestedServices =
    candidate.requested_services as
      | Record<string, unknown>
      | null
      | undefined;

  if (requestedServices?.iqama === true) {
    pipelineCounts.iqama += 1;
  }
}