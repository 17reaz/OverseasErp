// src/modules/erp/candidates/components/candidate-next-stage-button.tsx

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CANDIDATE_STAGE_DEFINITIONS,
  getCandidateStageLabel,
  getNextCandidateStage,
} from "../candidate-stage";

import type { CandidateStage } from "../candidate-stage";

import {
  completeCandidate,
  getCandidateById,
  updateCandidateStage,
} from "../candidate-service";

import type { Candidate } from "../candidate-types";

import { refreshModuleStatus } from "../profile/status-service";
import type { ModuleStatus } from "../profile/types";

function formatModuleStatusLabel(status: ModuleStatus): string {
  if (status === "not_started") return "Not started";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface CandidateNextStageButtonProps {
  candidate: Pick<Candidate, "id" | "current_stage" | "final_status">;
  onSuccess: (candidate: Candidate) => void;
  size?: "sm" | "default";
}

type PendingChange =
  | { type: "stage"; stage: CandidateStage }
  | { type: "complete" }
  | null;

export function CandidateNextStageButton({
  candidate,
  onSuccess,
  size = "sm",
}: CandidateNextStageButtonProps) {
  const [pendingChange, setPendingChange] = useState<PendingChange>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Current stage changed (e.g. after this button just advanced it) —
  // the cached tooltip status no longer applies, so drop it and let
  // the next hover fetch fresh.
  useEffect(() => {
    setStatusLabel(null);
  }, [candidate.current_stage]);

  if (candidate.final_status !== null) {
    return null;
  }

  const nextStage = getNextCandidateStage(candidate.current_stage);
  const isAutoComplete = nextStage === null;

  const closeDialog = (open: boolean) => {
    if (!open) {
      setPendingChange(null);
      setReason("");
      setError(null);
    }
  };

  const refreshAndNotify = async () => {
    const updated = await getCandidateById(candidate.id);
    if (updated) onSuccess(updated);
  };

  // Only hit the DB when the tooltip actually opens — not on every
  // table render — and only once per current_stage (cached in state).
  const handleTooltipOpenChange = (open: boolean) => {
    if (!open || statusLabel !== null || statusLoading) return;

    if (!candidate.current_stage) {
      setStatusLabel("Not started yet");
      return;
    }

    setStatusLoading(true);

    refreshModuleStatus(candidate.current_stage, candidate.id)
      .then((status) => {
        setStatusLabel(status ? formatModuleStatusLabel(status) : "No record");
      })
      .catch(() => {
        setStatusLabel("Unable to load status");
      })
      .finally(() => {
        setStatusLoading(false);
      });
  };

  const handleConfirm = async () => {
    if (!pendingChange) return;

    try {
      setLoading(true);
      setError(null);

      if (pendingChange.type === "complete") {
        await completeCandidate(candidate.id, reason.trim() || undefined);
      } else {
        await updateCandidateStage(candidate.id, pendingChange.stage);
      }

      await refreshAndNotify();
      closeDialog(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update candidate stage.",
      );
    } finally {
      setLoading(false);
    }
  };

  const showReasonField = pendingChange?.type === "complete";

  const dialogTitle =
    pendingChange?.type === "complete"
      ? "Mark Candidate Complete"
      : pendingChange?.type === "stage"
        ? `Change Stage to ${getCandidateStageLabel(pendingChange.stage)}`
        : "";

  const dialogDescription =
    pendingChange?.type === "complete"
      ? "This will mark the candidate's workflow as complete right now, skipping any remaining stages."
      : pendingChange?.type === "stage"
        ? `The candidate's current stage will change to "${getCandidateStageLabel(pendingChange.stage)}". This can move forward, backward, or skip stages — the change is immediate.`
        : "";

  return (
    <>
      <Tooltip onOpenChange={handleTooltipOpenChange}>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="outline"
              size={size}
              className="rounded-r-none"
              onClick={() =>
                setPendingChange(
                  isAutoComplete
                    ? { type: "complete" }
                    : { type: "stage", stage: nextStage as CandidateStage },
                )
              }
            >
              {isAutoComplete ? "Complete" : `Move to ${getCandidateStageLabel(nextStage)}`}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size={size}
                  className="rounded-l-none border-l-0 px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {!isAutoComplete && (
                  <DropdownMenuItem
                    onClick={() => setPendingChange({ type: "complete" })}
                  >
                    Mark Complete
                  </DropdownMenuItem>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Stage</DropdownMenuSubTrigger>

                  <DropdownMenuSubContent>
                    {CANDIDATE_STAGE_DEFINITIONS.map((definition) => (
                      <DropdownMenuItem
                        key={definition.value}
                        disabled={definition.value === candidate.current_stage}
                        onClick={() =>
                          setPendingChange({
                            type: "stage",
                            stage: definition.value,
                          })
                        }
                      >
                        {definition.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>

        <TooltipContent>
          {candidate.current_stage ? (
            <p>
              {getCandidateStageLabel(candidate.current_stage)} status:{" "}
              {statusLoading ? "Loading..." : (statusLabel ?? "—")}
            </p>
          ) : (
            <p>Not started yet.</p>
          )}
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={pendingChange !== null} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>

          {showReasonField && (
            <div className="space-y-2">
              <Textarea
                placeholder="Reason (optional)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}