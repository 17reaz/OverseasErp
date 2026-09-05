// src/modules/erp/candidates/components/candidate-stage.tsx
//
// "Manage Service" sheet — the single control panel for a
// candidate's workflow stage. Replaces the old requested-services-
// only sheet AND the old CandidateNextStageButton (deleted).
//
// - Shows the full pipeline in order, with each stage's live
//   status (completed / current / pending / skipped).
// - Only the CURRENT stage's row is clickable — it opens that
//   module's own record sheet directly (reusing the existing
//   generic ModuleRecordsSheet, no bespoke UI per module).
// - Toggling a stage on/off (requested_services) recomputes and
//   persists current_stage in one step via stage-service.ts.
// - "Mark Complete" stays a deliberate, separate staff action —
//   the engine never auto-completes a candidate.
// - Frozen (cancelled / returned / already complete) candidates:
//   everything here becomes read-only.

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

import { cn } from "@/lib/utils";
import { toast } from "@/components/shared/toast/toast";

import type { Candidate } from "../candidate-types";
import {
  fetchCandidateStageState,
  setServiceRequested,
  markCandidateComplete,
  type CandidateStageState,
  type RequestedServiceKey,
} from "../stage-service";

import { MODULES } from "../profile/module-configs";
import { ModuleRecordsSheet } from "../profile/module-records-sheet";

interface CandidateStageSheetProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after any change that other views (e.g. the table) should refresh for. */
  onSuccess?: () => void;
}

export function CandidateStageSheet({
  candidate,
  open,
  onOpenChange,
  onSuccess,
}: CandidateStageSheetProps) {
  const [state, setState] = useState<CandidateStageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<RequestedServiceKey | null>(
    null,
  );

  const [moduleSheetOpen, setModuleSheetOpen] = useState(false);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeReason, setCompleteReason] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!open || !candidate) return;

    let active = true;
    setLoading(true);

    fetchCandidateStageState(candidate)
      .then((s) => {
        if (active) setState(s);
      })
      .catch(() => {
        if (active) {
          toast.error("Failed to load stage info.", "Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, candidate]);

  async function refresh() {
    if (!candidate) return;
    setState(await fetchCandidateStageState(candidate));
  }

  async function handleToggle(key: RequestedServiceKey, value: boolean) {
    if (!candidate) return;
    setTogglingKey(key);

    try {
      const next = await setServiceRequested(candidate, key, value);
      setState(next);
      onSuccess?.();
    } catch (err) {
      toast.error(
        "Failed to update service.",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setTogglingKey(null);
    }
  }

  async function handleMarkComplete() {
    if (!candidate) return;
    setCompleting(true);

    try {
      await markCandidateComplete(
        candidate.id,
        completeReason.trim() || undefined,
      );

      toast.success("Candidate marked complete.");
      setCompleteDialogOpen(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        "Failed to mark complete.",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setCompleting(false);
    }
  }

  const currentModule =
    state && !state.frozen && !state.readyToComplete
      ? MODULES.find((m) => m.key === state.currentStage)
      : undefined;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Manage Service</SheetTitle>

            <SheetDescription>
              {candidate
                ? `${candidate.name} — pipeline & requested services`
                : "Pipeline & requested services"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-1 overflow-y-auto px-6 py-4">
            {loading || !state ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : (
              <>
                {state.frozen && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
                    <Lock className="size-4 shrink-0" />
                    This candidate's workflow is not active — stage is
                    frozen.
                  </div>
                )}

                {!state.frozen && state.readyToComplete && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="size-4 shrink-0" />
                    All requested stages are complete — Service Complete.
                  </div>
                )}

                {state.rows
                  .filter((row) => row.stage !== "candidate")
                  .map((row) => {
                    const clickable = row.isCurrent && !state.frozen;

                    return (
                      <div key={row.stage}>
                        <div
                          role={clickable ? "button" : undefined}
                          onClick={
                            clickable
                              ? () => setModuleSheetOpen(true)
                              : undefined
                          }
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md py-3",
                            clickable &&
                              "-mx-2 cursor-pointer px-2 hover:bg-muted",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {row.isCompleted ? (
                              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            ) : (
                              <span className="size-4 shrink-0" />
                            )}

                            <span
                              className={cn(row.isCurrent && "font-medium")}
                            >
                              {row.label}
                            </span>

                            {row.isCurrent && (
                              <Badge variant="outline">Current</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {row.isCompleted
                                ? "Completed"
                                : !row.requested
                                  ? "Skipped"
                                  : row.isCurrent
                                    ? "In progress"
                                    : "Pending"}
                            </span>

                            {row.serviceKey && (
                              <Switch
                                checked={row.requested}
                                disabled={
                                  state.frozen ||
                                  togglingKey === row.serviceKey
                                }
                                onCheckedChange={(checked) =>
                                  handleToggle(row.serviceKey!, checked)
                                }
                              />
                            )}
                          </div>
                        </div>

                        <Separator />
                      </div>
                    );
                  })}
              </>
            )}
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            {state && !state.frozen && (
              <Button
                type="button"
                onClick={() => setCompleteDialogOpen(true)}
              >
                Mark Complete
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* =================================================
          DRILL-IN — current stage's own module sheet
          (existing generic component, reused as-is)
      ================================================= */}

      {currentModule && candidate && (
        <ModuleRecordsSheet
          module={currentModule}
          candidateId={candidate.id}
          open={moduleSheetOpen}
          onOpenChange={(value) => {
            setModuleSheetOpen(value);
            if (!value) {
              // A record may have just been added/completed there —
              // re-sync this sheet's view of the pipeline.
              void refresh();
              onSuccess?.();
            }
          }}
        />
      )}

      {/* =================================================
          MARK COMPLETE — confirmation
      ================================================= */}

      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={(value) => !completing && setCompleteDialogOpen(value)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Candidate Complete</AlertDialogTitle>

            <AlertDialogDescription>
              This marks the candidate's entire workflow as complete. This
              is a deliberate action — it does not happen automatically
              even when every requested stage is done.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            placeholder="Reason (optional)"
            value={completeReason}
            onChange={(event) => setCompleteReason(event.target.value)}
            disabled={completing}
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleMarkComplete();
              }}
              disabled={completing}
            >
              {completing && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
