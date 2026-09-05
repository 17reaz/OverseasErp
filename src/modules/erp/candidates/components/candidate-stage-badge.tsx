// src/modules/erp/candidates/components/candidate-stage-badge.tsx
//
// Table cell for the "Stage" column.
// - Click  → opens the Manage Service sheet (via onClick prop).
// - Hover  → lazily fetches and shows the CURRENT module's live
//   status in a tooltip (same idea as the old
//   CandidateNextStageButton tooltip — only fetches once per
//   hover-open, cached until the stage itself changes).

import { useEffect, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getCandidateStageLabel } from "../stage-service";
import type { CandidateStage } from "../stage-service";
import { refreshModuleStatus } from "../profile/status-service";
import type { ModuleStatus } from "../profile/types";

function formatModuleStatusLabel(status: ModuleStatus): string {
  if (status === "not_started") return "Not started";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface CandidateStageBadgeProps {
  candidateId: string;
  currentStage: CandidateStage | null;
  onClick: () => void;
}

export function CandidateStageBadge({
  candidateId,
  currentStage,
  onClick,
}: CandidateStageBadgeProps) {
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Stage changed (e.g. after a toggle in the sheet just moved it
  // forward) — the cached tooltip status no longer applies.
  useEffect(() => {
    setStatusLabel(null);
  }, [currentStage]);

  function handleTooltipOpenChange(open: boolean) {
    if (!open || statusLabel !== null || statusLoading) return;

    if (!currentStage || currentStage === "candidate") {
      setStatusLabel("Not started yet");
      return;
    }

    setStatusLoading(true);

    refreshModuleStatus(currentStage, candidateId)
      .then((status) => {
        setStatusLabel(status ? formatModuleStatusLabel(status) : "No record");
      })
      .catch(() => {
        setStatusLabel("Unable to load status");
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }

  return (
    <Tooltip onOpenChange={handleTooltipOpenChange}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
        >
          {getCandidateStageLabel(currentStage)}
        </button>
      </TooltipTrigger>

      <TooltipContent>
        {currentStage && currentStage !== "candidate" ? (
          <p>
            {getCandidateStageLabel(currentStage)} status:{" "}
            {statusLoading ? "Loading..." : (statusLabel ?? "—")}
          </p>
        ) : (
          <p>Not started yet.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
