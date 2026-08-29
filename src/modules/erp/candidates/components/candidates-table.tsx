// src/modules/erp/candidates/components/candidates-table.tsx

import {
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Candidate } from "../candidate-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

/* =========================================================
 * PROPS
 * ========================================================= */

interface CandidatesTableProps {
  candidates: Candidate[];

  loading?: boolean;

  // Optional controlled pagination — omit to let DataTable
  // paginate the full `candidates` array itself.
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onDownloadPassport?: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidate: Candidate) => void;
  onReturn?: (candidate: Candidate) => void;
  onRestore?: (candidate: Candidate) => void;
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

export function CandidatesTable({
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onDownloadPassport,
  onEdit,
  onDelete,
  onReturn,
  onRestore,
}: CandidatesTableProps) {
  const columns: DataTableColumn<Candidate>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[70px]",
      cell: (candidate) => candidate.sl ?? "—",
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (candidate) => (
        <Link
          to={`/app/candidates/${candidate.id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {candidate.name}
        </Link>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (candidate) => (
        <span className="block truncate">{candidate.passport_no}</span>
      ),
    },
    {
      key: "country",
      header: "Country",
      hideOnMobile: true,
      cell: (candidate) => (
        <span className="block truncate">{candidate.country ?? "—"}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (candidate) => (
        <span className="inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium">
          {candidate.current_stage ?? "Pending"}
        </span>
      ),
    },
    {
      key: "received",
      header: "Received",
      hideOnMobile: true,
      cell: (candidate) => candidate.received_date ?? "—",
    },
    {
      key: "agent",
      header: "Agent",
      className: "w-[180px]",
      hideOnMobile: true,
      cell: (candidate) =>
        candidate.agent ? (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">
              {candidate.agent.name ?? "Unnamed Agent"}
            </span>

            {candidate.agent.code && (
              <span className="truncate text-xs text-muted-foreground">
                {candidate.agent.code}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[110px]",
      cell: (candidate) =>
        candidate.is_returned ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-help">
                Returned
              </Badge>
            </TooltipTrigger>

            <TooltipContent>
              <p>
                Returned date:{" "}
                {candidate.returned_date
                  ? new Date(candidate.returned_date).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : "Not available"}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant="default">Active</Badge>
        ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[70px] text-right",
      cell: (candidate) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" type="button">
              <MoreHorizontal />
              <span className="sr-only">Open candidate actions</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDownloadPassport?.(candidate)}
            >
              <Plus />
              Add to..
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onDownloadPassport?.(candidate)}
            >
              <Download />
              Download Passport
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit?.(candidate)}>
              <Pencil />
              Edit
            </DropdownMenuItem>

            {!candidate.is_returned && (
              <DropdownMenuItem onClick={() => onReturn?.(candidate)}>
                <RotateCcw />
                Mark as Returned
              </DropdownMenuItem>
            )}

            {candidate.is_returned && (
              <DropdownMenuItem onClick={() => onRestore?.(candidate)}>
                <RotateCcw />
                Restore Candidate
              </DropdownMenuItem>
            )}

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
      ),
    },
  ];

  return (
    <TooltipProvider>
      <DataTable
        columns={columns}
        data={candidates}
        getRowKey={(candidate) => candidate.id}
        loading={loading}
        emptyTitle="No candidates found"
        emptyDescription="Try changing your search."
        pageSize={pageSize}
        page={page}
        onPageChange={onPageChange}
        total={total}
        serverPagination={typeof total === "number" && total !== candidates.length}
      />
    </TooltipProvider>
  );
}