import {
  Ban,
  Globe2,
  Lock,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
  UserRound,
  UserSearch,
  Briefcase,
  IdCard,
  ArrowUpRight,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import type { Candidate } from "../candidate-service";

import { getCandidateOverallStatus } from "../candidate-selectors";

/* =========================================================
   PROPS (unchanged)
========================================================= */

interface CandidatesGridProps {
  candidates: Candidate[];
  loading?: boolean;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidate: Candidate) => void;
  onReturn?: (candidate: Candidate) => void;
  onRestore?: (candidate: Candidate) => void;
  onCancel?: (candidate: Candidate) => void;
  onReactivate?: (candidate: Candidate) => void;
}

/* =========================================================
   SMALL PARTS
========================================================= */

const GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

function MetaItem({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0">
        <p className="text-[11px] leading-none text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-1 truncate text-[13px] font-medium leading-none ${
            muted ? "text-muted-foreground" : "text-foreground"
          }`}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export function CandidatesGrid({
  candidates,
  loading = false,
  onEdit,
  onDelete,
  onReturn,
  onRestore,
  onCancel: _onCancel,
  onReactivate,
}: CandidatesGridProps) {
  /* ------------------------- LOADING ------------------------- */

  if (loading) {
    return (
      <div className={GRID_CLASS} aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border bg-card"
          >
            <div className="h-1 w-full animate-pulse bg-muted" />
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
              <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 animate-pulse rounded bg-muted/50" />
                <div className="h-8 animate-pulse rounded bg-muted/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ------------------------- EMPTY --------------------------- */

  if (candidates.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/[0.03] px-6">
        <div className="max-w-xs text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-background">
            <UserSearch className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm font-semibold">No candidates found</p>

          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Nothing matches your current search or filters. Try a different
            name, passport number, or clear the filters.
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------- GRID --------------------------- */

  return (
    <div className={GRID_CLASS}>
      {candidates.map((candidate) => {
        /* ---- basic data (unchanged) ---- */

        const fullName = candidate.name || "Unknown candidate";

        const initials = fullName
          .split(" ")
          .filter(Boolean)
          .map((part) => part.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const agentName =
          candidate.agent?.name || candidate.agent?.code || "No agent";

        const stage = candidate.current_stage || "Not assigned";

        const country = candidate.country || "Country not set";

        /* ---- status (unchanged) ---- */

        const status = getCandidateOverallStatus(candidate, {
          moduleStatus: candidate.workflow_state ?? null,
        });

        const isReturned = status === "returned";
        const isCancelled = status === "cancelled";
        const isComplete = status === "complete";

        /* ---- status styling ---- */

        const statusLabel = isReturned
          ? "Returned"
          : isCancelled
            ? "Cancelled"
            : isComplete
              ? "Complete"
              : "Active";

        const badgeClass = isReturned
          ? "bg-destructive/10 text-destructive ring-destructive/20"
          : isCancelled
            ? "bg-muted text-muted-foreground ring-border"
            : isComplete
              ? "bg-primary/10 text-primary ring-primary/20"
              : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400";

        const dotClass = isReturned
          ? "bg-destructive"
          : isCancelled
            ? "bg-muted-foreground"
            : isComplete
              ? "bg-primary"
              : "bg-emerald-500";

        const accentClass = isReturned
          ? "bg-destructive/70"
          : isCancelled
            ? "bg-muted-foreground/30"
            : isComplete
              ? "bg-primary/70"
              : "bg-emerald-500/70";

        const dimmed = isCancelled;

        return (
          <article
            key={candidate.id}
            className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-px hover:border-foreground/15 hover:shadow-md ${
              dimmed ? "opacity-80" : ""
            }`}
          >
            {/* status accent */}
            <div className={`h-1 w-full ${accentClass}`} />

            <div className="flex flex-1 flex-col p-4">
              {/* ---------------- HEADER ---------------- */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        dimmed
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {initials || <UserRound className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h3
                      className="truncate text-sm font-semibold leading-tight"
                      title={fullName}
                    >
                      {fullName}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <IdCard className="h-3 w-3 shrink-0" />
                      <span className="truncate tabular-nums">
                        {candidate.passport_no || "No passport"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                    {statusLabel}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Candidate actions</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-52">
                      {/* EDIT */}
                      {!isComplete && (
                        <DropdownMenuItem onClick={() => onEdit?.(candidate)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}

                      {/* RETURN */}
                      {!isReturned && !isCancelled && !isComplete && (
                        <DropdownMenuItem
                          onClick={() => onReturn?.(candidate)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Return
                        </DropdownMenuItem>
                      )}

                      {/* RESTORE */}
                      {isReturned && (
                        <DropdownMenuItem
                          onClick={() => onRestore?.(candidate)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore Candidate
                        </DropdownMenuItem>
                      )}

                      {/* CANCEL */}
                      {!isReturned && !isCancelled && !isComplete && (
                        <DropdownMenuItem
                          onClick={() => _onCancel?.(candidate)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Candidate
                        </DropdownMenuItem>
                      )}

                      {/* REACTIVATE */}
                      {isCancelled && (
                        <DropdownMenuItem
                          onClick={() => onReactivate?.(candidate)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Reactivate Candidate
                        </DropdownMenuItem>
                      )}

                      {/* DELETE */}
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onDelete?.(candidate)}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ---------------- CURRENT STAGE ---------------- */}
              <div className="mt-4 rounded-lg border bg-muted/30 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Current stage
                </p>

                <p
                  className={`mt-1 truncate text-sm font-medium ${
                    candidate.current_stage
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  title={stage}
                >
                  {stage}
                </p>
              </div>

              {/* ---------------- META ---------------- */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetaItem
                  icon={Briefcase}
                  label="Agent"
                  value={agentName}
                  muted={agentName === "No agent"}
                />

                <MetaItem
                  icon={Globe2}
                  label="Country"
                  value={country}
                  muted={country === "Country not set"}
                />
              </div>

              {/* ---------------- FOOTER ---------------- */}
              <div className="mt-auto pt-4" />
              <div className="flex items-center justify-between border-t pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {isComplete && (
                    <>
                      <Lock className="h-3 w-3" />
                      Read only
                    </>
                  )}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs font-medium"
                  onClick={() => onEdit?.(candidate)}
                  disabled={isComplete}
                >
                  View / Edit
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
