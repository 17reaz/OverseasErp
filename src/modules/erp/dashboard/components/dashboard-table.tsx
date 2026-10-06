// src/modules/erp/dashboard/components/dashboard-table.tsx

import { ArrowUpRight, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { DashboardCandidate } from "../dashboard-service";

interface Props {
  candidates: DashboardCandidate[];
  loading?: boolean;
}

const MAX_ROWS = 5;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStageLabel(stage: string | null) {
  if (!stage) return "Not started";

  return stage
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardTable({ candidates, loading = false }: Props) {
  /* LOADING */
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: MAX_ROWS }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  /* EMPTY */
  if (candidates.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-medium">No candidates yet</p>

        <p className="text-xs text-muted-foreground">
          Candidate records will appear here.
        </p>
      </div>
    );
  }

  /* LIST */
  return (
    <ul className="divide-y">
      {candidates.slice(0, MAX_ROWS).map((candidate) => (
        <li
          key={candidate.id}
          className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Left: name + id/passport */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {candidate.name}
            </p>

            <p className="truncate text-[11px] text-muted-foreground">
              <span className="font-mono">{candidate.id.slice(0, 8)}</span>
              {candidate.passport_no && (
                <>
                  {" · "}
                  <span className="font-mono">{candidate.passport_no}</span>
                </>
              )}
            </p>
          </div>

          {/* Middle: stage + received date */}
          <div className="hidden min-w-0 shrink-0 text-right sm:block">
            <p className="truncate text-xs font-medium leading-tight">
              {getStageLabel(candidate.current_stage)}
            </p>

            <p className="text-[11px] text-muted-foreground">
              {formatDate(candidate.created_at)}
            </p>
          </div>

          {/* Right: status + open */}
          <div className="flex shrink-0 items-center gap-1">
            <Badge
              variant={candidate.is_returned ? "destructive" : "secondary"}
              className="px-1.5 py-0 text-[10px]"
            >
              {candidate.is_returned ? "Returned" : "Active"}
            </Badge>

            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}