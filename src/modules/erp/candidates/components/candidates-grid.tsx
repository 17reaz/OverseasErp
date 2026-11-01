import { useState } from "react";
import {
  ArrowUpRight,
  Ban,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe2,
  Lock,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
  Undo2,
  UserRound,
  UserSearch,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import type { Candidate } from "../candidate-service";

import { getCandidateOverallStatus } from "../candidate-selectors";

/* =========================================================
   PROPS (existing props unchanged, new ones optional)

   Pagination works in two modes:
   1. Client mode (default): pass all candidates, the grid slices them.
   2. Server mode: pass only the current page's candidates plus
      `page`, `totalCount` and `onPageChange`.
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

  /** Opens a candidate (also complete ones). Falls back to onEdit. */
  onOpen?: (candidate: Candidate) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onAdd?: () => void;

  /** Cards per page (default 12). */
  pageSize?: number;
  /** Server mode only. 1-based. */
  page?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

/* Spacing overrides so it looks the same on old and new shadcn Card */
const CARD =
  "cursor-pointer gap-0 py-0 shadow-none transition-colors hover:bg-muted/40";
const HEADER = "p-3.5 pb-2";
const CONTENT = "space-y-2 px-3.5 pb-3.5";

/* =========================================================
   HELPERS
========================================================= */

function getPageList(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(count - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < count - 2) pages.push("…");
  pages.push(count);
  return pages;
}

/* =========================================================
   SMALL PARTS
========================================================= */

function PassportLine({ passportNo }: { passportNo?: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy(event: React.MouseEvent) {
    event.stopPropagation();
    if (!passportNo) return;
    try {
      await navigator.clipboard.writeText(passportNo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <CardDescription className="flex items-center gap-1 text-xs">
      <span className="truncate tabular-nums">
        {passportNo || "No passport"}
      </span>
      {passportNo && (
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={copied ? "Passport number copied" : "Copy passport number"}
        >
          {copied ? (
            <Check className="size-3 text-emerald-600" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      )}
    </CardDescription>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "returned":
      return <Badge variant="destructive">Returned</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelled</Badge>;
    case "complete":
      return <Badge>Complete</Badge>;
    default:
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        >
          Active
        </Badge>
      );
  }
}

function PaginationBar({
  current,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  current: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {getPageList(current, pageCount).map((p, index) =>
          p === "…" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === current ? "default" : "ghost"}
              size="icon"
              className="size-8 text-xs tabular-nums"
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={current === pageCount}
          onClick={() => onChange(current + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
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
  onCancel,
  onReactivate,
  onOpen,
  hasActiveFilters = false,
  onClearFilters,
  onAdd,
  pageSize = 12,
  page,
  totalCount,
  onPageChange,
}: CandidatesGridProps) {
  const [localPage, setLocalPage] = useState(1);

  /* ------------------------ PAGINATION ----------------------- */

  const serverMode = totalCount !== undefined && onPageChange !== undefined;
  const total = serverMode ? totalCount : candidates.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(serverMode ? (page ?? 1) : localPage, 1), pageCount);

  const visible = serverMode
    ? candidates
    : candidates.slice((current - 1) * pageSize, current * pageSize);

  function goToPage(next: number) {
    if (serverMode) onPageChange?.(next);
    else setLocalPage(next);
  }

  /* ------------------------- LOADING ------------------------- */

  if (loading) {
    return (
      <div className={GRID_CLASS} aria-busy="true">
        {Array.from({ length: Math.min(pageSize, 8) }).map((_, index) => (
          <Card key={index} className="gap-0 py-0 shadow-none">
            <CardContent className="space-y-3 p-3.5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  /* ------------------------- EMPTY --------------------------- */

  if (visible.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <UserSearch className="size-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-sm font-semibold">
            {hasActiveFilters ? "No candidates found" : "No candidates yet"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Nothing matches your search or filters. Try a different name or passport number, or clear the filters."
              : "Add your first candidate to start tracking their progress."}
          </p>

          {hasActiveFilters && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          )}
          {!hasActiveFilters && onAdd && (
            <Button size="sm" className="mt-4" onClick={onAdd}>
              Add candidate
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  /* -------------------------- GRID --------------------------- */

  return (
    <div>
      <div className={GRID_CLASS}>
        {visible.map((candidate) => {
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

          const status = getCandidateOverallStatus(candidate, {
            moduleStatus: candidate.workflow_state ?? null,
          });

          const isReturned = status === "returned";
          const isCancelled = status === "cancelled";
          const isComplete = status === "complete";
          const isActive = !isReturned && !isCancelled && !isComplete;

          const open = () => (onOpen ?? onEdit)?.(candidate);

          return (
            <Card key={candidate.id} className={CARD} onClick={open}>
              {/* ---------------- HEADER ---------------- */}
              <CardHeader className={HEADER}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback
                        className={`text-xs ${
                          isCancelled
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {initials || <UserRound className="size-3.5" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm leading-tight">
                        <button
                          type="button"
                          className="max-w-full truncate rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title={fullName}
                          onClick={(event) => {
                            event.stopPropagation();
                            open();
                          }}
                        >
                          {fullName}
                        </button>
                      </CardTitle>
                      <PassportLine passportNo={candidate.passport_no} />
                    </div>
                  </div>

                  <div onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1 size-8 shrink-0 text-muted-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">
                            Actions for {fullName}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={open}>
                          <ArrowUpRight />
                          {isComplete ? "View" : "Open"}
                        </DropdownMenuItem>

                        {!isComplete && (
                          <DropdownMenuItem onClick={() => onEdit?.(candidate)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {isActive && (
                          <DropdownMenuItem
                            onClick={() => onReturn?.(candidate)}
                          >
                            <RotateCcw />
                            Return
                          </DropdownMenuItem>
                        )}

                        {isReturned && (
                          <DropdownMenuItem
                            onClick={() => onRestore?.(candidate)}
                          >
                            <Undo2 />
                            Restore candidate
                          </DropdownMenuItem>
                        )}

                        {isActive && (
                          <DropdownMenuItem
                            onClick={() => onCancel?.(candidate)}
                          >
                            <Ban />
                            Cancel candidate
                          </DropdownMenuItem>
                        )}

                        {isCancelled && (
                          <DropdownMenuItem
                            onClick={() => onReactivate?.(candidate)}
                          >
                            <PlayCircle />
                            Reactivate candidate
                          </DropdownMenuItem>
                        )}

                        {!isComplete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete?.(candidate)}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* ---------------- CONTENT ---------------- */}
              <CardContent className={CONTENT}>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm ${
                      candidate.current_stage
                        ? "font-medium"
                        : "text-muted-foreground"
                    }`}
                    title={stage}
                  >
                    {stage}
                  </p>
                  <StatusBadge status={status} />
                </div>

                <p className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span
                    className="flex min-w-0 items-center gap-1"
                    title={agentName}
                  >
                    <Briefcase className="size-3 shrink-0" />
                    <span className="truncate">{agentName}</span>
                  </span>
                  <span
                    className="flex min-w-0 items-center gap-1"
                    title={country}
                  >
                    <Globe2 className="size-3 shrink-0" />
                    <span className="truncate">{country}</span>
                  </span>
                  {isComplete && (
                    <span
                      className="ml-auto flex shrink-0 items-center gap-1"
                      title="Read only"
                    >
                      <Lock className="size-3" />
                      <span className="sr-only">Read only</span>
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {total > pageSize && (
        <PaginationBar
          current={current}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onChange={goToPage}
        />
      )}
    </div>
  );
}
