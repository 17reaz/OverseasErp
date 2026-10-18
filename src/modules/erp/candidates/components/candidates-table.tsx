import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban,
  Check,
  Copy,
  FileText,
  ListChecks,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Candidate } from "../candidate-types";
import { getCandidateOverallStatus } from "../candidate-selectors";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import { CandidateStageBadge } from "./candidate-stage-badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface CandidatesTableProps {
  candidates: Candidate[];
  newCandidateIds?: Set<string>;
  updatedCandidateIds?: Set<string>;
  updatedCandidateFields?: Map<string, Set<string>>;

  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onPassportAction?: (candidate: Candidate) => void;
  onManageServices?: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidate: Candidate) => void;
  onReturn?: (candidate: Candidate) => void;
  onRestore?: (candidate: Candidate) => void;
  onCancel?: (candidate: Candidate) => void;
  onReactivate?: (candidate: Candidate) => void;
  onCandidateUpdated?: (candidate: Candidate) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

const EMPTY_IDS = new Set<string>();
const EMPTY_FIELDS = new Map<string, Set<string>>();

const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";

const COPIED_RESET_MS = 1200;

function getStatus(candidate: Candidate) {
  return getCandidateOverallStatus(candidate, {
    moduleStatus: candidate.workflow_state ?? null,
  });
}

function formatReturnedDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Cells                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Candidate name. On mobile the hidden columns (SL / passport) are shown
 * as a small second line, so no information disappears on small screens.
 */
function CandidateCell({ candidate }: { candidate: Candidate }) {
  return (
    <div className="min-w-0">
      <Link
        to={`/app/candidates/${candidate.id}`}
        className="block truncate text-sm font-medium hover:underline"
      >
        {candidate.name}
      </Link>

      <p className="truncate text-xs text-muted-foreground sm:hidden">
        #{candidate.sl ?? "—"} · {candidate.passport_no ?? "—"}
      </p>
    </div>
  );
}

function PassportCell({
  candidate,
  isCopied,
  onCopy,
}: {
  candidate: Candidate;
  isCopied: boolean;
  onCopy: (candidate: Candidate) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onCopy(candidate);
      }}
      disabled={!candidate.passport_no}
      className={`group flex max-w-full items-center gap-1.5 rounded-sm text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50 ${
        isCopied ? "animate-pulse" : ""
      }`}
      title={isCopied ? "Copied" : "Copy passport number"}
    >
      <span
        className={`block truncate transition-all duration-200 ${
          isCopied ? "font-medium opacity-70" : ""
        }`}
      >
        {candidate.passport_no ?? "—"}
      </span>

      {candidate.passport_no && (
        <span
          className={`shrink-0 transition-all duration-200 ${
            isCopied
              ? "text-green-600"
              : "text-muted-foreground opacity-0 group-hover:opacity-100"
          }`}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </span>
      )}
    </button>
  );
}

function AgentCell({ candidate }: { candidate: Candidate }) {
  if (!candidate.agent) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium">
        {candidate.agent.name ?? "Unnamed Agent"}
      </span>
    </div>
  );
}

function StatusCell({ candidate }: { candidate: Candidate }) {
  const status = getStatus(candidate);

  if (status === "returned") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="cursor-help">
            Returned
          </Badge>
        </TooltipTrigger>

        <TooltipContent>
          <p>Returned date: {formatReturnedDate(candidate.returned_date)}</p>

          {candidate.returned_reason && (
            <p className="mt-1">Reason: {candidate.returned_reason}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (status === "cancelled") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            Cancelled
          </Badge>
        </TooltipTrigger>

        {candidate.final_reason && (
          <TooltipContent>
            <p>Reason: {candidate.final_reason}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  if (status === "complete") {
    return <Badge variant="outline">Complete</Badge>;
  }

  return <Badge variant="default">Active</Badge>;
}

/* -------------------------------------------------------------------------- */
/*  Action menu                                                               */
/*                                                                            */
/*    1. Open      Passport · Manage Services · Edit                          */
/*    2. Lifecycle Mark as Returned · Cancel  /  Restore  /  Reactivate       */
/*    3. Danger    Delete                                                     */
/* -------------------------------------------------------------------------- */

interface CandidateActionsProps {
  candidate: Candidate;
  onPassportAction?: (candidate: Candidate) => void;
  onManageServices?: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidate: Candidate) => void;
  onReturn?: (candidate: Candidate) => void;
  onRestore?: (candidate: Candidate) => void;
  onCancel?: (candidate: Candidate) => void;
  onReactivate?: (candidate: Candidate) => void;
}

function CandidateActions({
  candidate,
  onPassportAction,
  onManageServices,
  onEdit,
  onDelete,
  onReturn,
  onRestore,
  onCancel,
  onReactivate,
}: CandidateActionsProps) {
  const status = getStatus(candidate);

  const isReturned = status === "returned";
  const isCancelled = status === "cancelled";
  const isComplete = status === "complete";
  const isOpen = !isReturned && !isCancelled && !isComplete;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <MoreHorizontal />
          <span className="sr-only">Open candidate actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        collisionPadding={8}
        className="max-w-[calc(100vw-1rem)]"
      >
        {/* 1. Open */}
        <DropdownMenuItem onClick={() => onPassportAction?.(candidate)}>
          <FileText />
          Passport
        </DropdownMenuItem>

        {!isComplete && (
          <DropdownMenuItem onClick={() => onManageServices?.(candidate)}>
            <ListChecks />
            Manage Services
          </DropdownMenuItem>
        )}

        {!isComplete && (
          <DropdownMenuItem onClick={() => onEdit?.(candidate)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
        )}

        {/* 2. Lifecycle */}
        {!isComplete && <DropdownMenuSeparator />}

        {isOpen && (
          <DropdownMenuItem onClick={() => onReturn?.(candidate)}>
            <RotateCcw />
            Mark as Returned
          </DropdownMenuItem>
        )}

        {isReturned && (
          <DropdownMenuItem onClick={() => onRestore?.(candidate)}>
            <RotateCcw />
            Restore Candidate
          </DropdownMenuItem>
        )}

        {isOpen && (
          <DropdownMenuItem onClick={() => onCancel?.(candidate)}>
            <Ban />
            Cancel Candidate
          </DropdownMenuItem>
        )}

        {isCancelled && (
          <DropdownMenuItem onClick={() => onReactivate?.(candidate)}>
            <PlayCircle />
            Reactivate Candidate
          </DropdownMenuItem>
        )}

        {/* 3. Danger */}
        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete?.(candidate)}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export function CandidatesTable({
  candidates,
  loading = false,
  newCandidateIds = EMPTY_IDS,
  updatedCandidateIds = EMPTY_IDS,
  updatedCandidateFields = EMPTY_FIELDS,
  page,
  pageSize = 10,
  total,
  onPageChange,

  onPassportAction,
  onManageServices,
  onEdit,
  onDelete,
  onReturn,
  onRestore,
  onCancel,
  onReactivate,
  onCandidateUpdated,
}: CandidatesTableProps) {
  const [copiedPassportId, setCopiedPassportId] = useState<string | null>(
    null,
  );

  const handleCopyPassport = async (candidate: Candidate) => {
    const passport = candidate.passport_no?.trim();

    if (!passport) return;

    try {
      await navigator.clipboard.writeText(passport);

      setCopiedPassportId(candidate.id);

      window.setTimeout(() => {
        setCopiedPassportId((current) =>
          current === candidate.id ? null : current,
        );
      }, COPIED_RESET_MS);
    } catch {
      // Clipboard API unavailable — do nothing.
    }
  };

  const columns: DataTableColumn<Candidate>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[70px]",
      hideOnMobile: true, // shown under the name on mobile
      cell: (candidate) => candidate.sl ?? "—",
    },

    {
      key: "candidate",
      fieldKey: "name",
      header: "Candidate",
      cell: (candidate) => <CandidateCell candidate={candidate} />,
    },

    {
      key: "passport",
      fieldKey: "passport_no",
      header: "Passport",
      hideOnMobile: true,
      cell: (candidate) => (
        <PassportCell
          candidate={candidate}
          isCopied={copiedPassportId === candidate.id}
          onCopy={(item) => void handleCopyPassport(item)}
        />
      ),
    },

    {
      key: "country",
      fieldKey: "country",
      header: "Country",
      hideOnMobile: true,
      cell: (candidate) => (
        <span className="block truncate">{candidate.country ?? "—"}</span>
      ),
    },

    // Global candidate stage (Candidate → Medical → MOFA → Visa → Flight).
    // Clicking the current stage opens that module's sheet directly (not via
    // Manage Service); nothing-started / frozen candidates fall back to
    // Manage Service. Hover tooltip shows the current module's live status.
    {
      key: "stage",
      fieldKey: "current_stage",
      header: "Stage",
      cell: (candidate) => (
        <CandidateStageBadge
          candidate={candidate}
          onOpenManageService={() => onManageServices?.(candidate)}
          onCandidateUpdated={(updated) => onCandidateUpdated?.(updated)}
        />
      ),
    },

    {
      key: "received",
      fieldKey: "received_date",
      header: "Received",
      hideOnMobile: true,
      cell: (candidate) => candidate.received_date ?? "—",
    },

    {
      key: "agent",
      fieldKey: "agent_id",
      header: "Agent",
      className: "w-[180px]",
      hideOnMobile: true,
      cell: (candidate) => <AgentCell candidate={candidate} />,
    },

    {
      key: "status",
      header: "Status",
      className: "w-[96px] sm:w-[120px]",
      cell: (candidate) => <StatusCell candidate={candidate} />,
    },

    {
      key: "action",
      header: "Action",
      className: "w-12 text-right sm:w-[70px]",
      cell: (candidate) => (
        <CandidateActions
          candidate={candidate}
          onPassportAction={onPassportAction}
          onManageServices={onManageServices}
          onEdit={onEdit}
          onDelete={onDelete}
          onReturn={onReturn}
          onRestore={onRestore}
          onCancel={onCancel}
          onReactivate={onReactivate}
        />
      ),
    },
  ];

  return (
    <TooltipProvider>
      <DataTable
        columns={columns}
        data={candidates}
        getRowKey={(candidate) => candidate.id}
        newRowKeys={newCandidateIds}
        updatedRowKeys={updatedCandidateIds}
        updatedFieldKeys={updatedCandidateFields}
        loading={loading}
        emptyTitle="No candidates found"
        emptyDescription="Try changing your search."
        pageSize={pageSize}
        page={page}
        onPageChange={onPageChange}
        className={TABLE_CLASS}
        total={total}
        serverPagination={
          typeof total === "number" && total !== candidates.length
        }
      />
    </TooltipProvider>
  );
}
