// src/modules/erp/candidates/components/candidate-stage-badge.tsx
//
// Table cell for the "Stage" column.
// - Click on the CURRENT stage (when there's a real module behind
//   it, and the candidate isn't frozen) → opens that module's own
//   ModuleRecordsSheet DIRECTLY — one click straight into the work,
//   no detour through Manage Service.
// - Anything else (nothing started yet / frozen candidate) → falls
//   back to opening the Manage Service sheet, since there's no
//   single module to jump into.
// - Hover → lazily fetches and shows the current module's live
//   status in a tooltip (same idea as the old
//   CandidateNextStageButton tooltip).
// - Closing the module sheet re-syncs current_stage (a record may
//   have just been completed there) and reports the fresh
//   candidate back up via onCandidateUpdated.

import { useEffect, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Candidate } from "../candidate-types";
import { getCandidateStageLabel, isStageFrozen, syncCurrentStage } from "../stage-service";
import { getCandidateById } from "../candidate-service";
import { refreshModuleStatus } from "../profile/status-service";
import type { ModuleStatus } from "../profile/types";
import { MODULES } from "../profile/module-configs";
import { ModuleRecordsSheet } from "../profile/module-records-sheet";

function formatModuleStatusLabel(status: ModuleStatus): string {
  if (status === "not_started") return "Not started";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface CandidateStageBadgeProps {
  candidate: Candidate;
  /** Fallback when there's no module to jump straight into. */
  onOpenManageService: () => void;
  onCandidateUpdated?: (candidate: Candidate) => void;
}

export function CandidateStageBadge({
  candidate,
  onOpenManageService,
  onCandidateUpdated,
}: CandidateStageBadgeProps) {
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [moduleSheetOpen, setModuleSheetOpen] = useState(false);

  const currentStage = candidate.current_stage;
  const module = MODULES.find((m) => m.key === currentStage);
  const frozen = isStageFrozen(candidate);

  // Stage changed (e.g. a record was just completed) — cached
  // tooltip status no longer applies.
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

    refreshModuleStatus(currentStage, candidate.id)
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

  function handleClick() {
    if (module && !frozen) {
      setModuleSheetOpen(true);
    } else {
      onOpenManageService();
    }
  }

  async function resyncAfterModuleChange() {
    try {
      await syncCurrentStage(candidate);
      const fresh = await getCandidateById(candidate.id);
      if (fresh) onCandidateUpdated?.(fresh);
    } catch {
      // Best-effort resync — the next full list refresh will
      // still catch it up.
    }
  }

  async function handleModuleSheetOpenChange(open: boolean) {
    setModuleSheetOpen(open);

    if (!open) {
      // A record may have just been added/completed there — resync
      // current_stage and hand the fresh candidate back up so the
      // row (and its badge) reflects it immediately.
      await resyncAfterModuleChange();
    }
  }

  return (
    <>
      <Tooltip onOpenChange={handleTooltipOpenChange}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
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

      {module && (
        <ModuleRecordsSheet
          module={module}
          candidateId={candidate.id}
          tenantId={candidate.tenant_id}
          open={moduleSheetOpen}
          onOpenChange={handleModuleSheetOpenChange}
          onSuccess={() => void resyncAfterModuleChange()}
        />
      )}
    </>
  );
}
