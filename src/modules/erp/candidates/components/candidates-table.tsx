
import {
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Ban,
  PlayCircle,
  Copy,
  Check,
  ListChecks,
} from "lucide-react";
import { useState } from "react";
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

import type { Candidate } from "../candidate-types";

import {
  getCandidateOverallStatus,
} from "../candidate-selectors";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
// import type { Candidate } from "../candidate-types";
// import { getCandidateOverallStatus } from "../candidate-selectors";
import { CandidateStageBadge } from "./candidate-stage-badge";


/* =========================================================
 * PROPS
 * ========================================================= */

interface CandidatesTableProps {
  candidates: Candidate[];

  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;

  onPageChange?: (
    page: number,
  ) => void;

  onPassportAction?: (
    candidate: Candidate,
  ) => void;
  onManageServices?: (candidate: Candidate) => void;

  onEdit?: (
    candidate: Candidate,
  ) => void;

  onDelete?: (
    candidate: Candidate,
  ) => void;

  onReturn?: (
    candidate: Candidate,
  ) => void;

  onRestore?: (
    candidate: Candidate,
  ) => void;

  onCancel?: (
    candidate: Candidate,
  ) => void;

  onReactivate?: (
    candidate: Candidate,
  ) => void;
  onCandidateUpdated?: (candidate: Candidate) => void;
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

const handleCopyPassport = async (
  candidate: Candidate,
) => {
  const passport = candidate.passport_no?.trim();

  if (!passport) return;

  try {
    await navigator.clipboard.writeText(passport);

    setCopiedPassportId(candidate.id);

    window.setTimeout(() => {
      setCopiedPassportId((current) =>
        current === candidate.id ? null : current,
      );
    }, 1200);
  } catch {
    // Clipboard API unavailable — do nothing.
  }
};
  /* =======================================================
     COLUMNS
  ======================================================= */

  const columns: DataTableColumn<Candidate>[] = [

    /* -----------------------------------------------------
       SL
    ----------------------------------------------------- */

    {
      key: "sl",

      header: "SL",

      className: "w-[70px]",

      cell: (candidate) =>
        candidate.sl ?? "—",
    },


    /* -----------------------------------------------------
       CANDIDATE
    ----------------------------------------------------- */

    {
      key: "candidate",

      header: "Candidate",

      cell: (candidate) => (

        <Link
          to={`/app/candidates/${candidate.id}`}
          className="
            block
            truncate
            text-sm
            font-medium
            hover:underline
          "
        >
          {candidate.name}
        </Link>

      ),
    },


    /* -----------------------------------------------------
       PASSPORT
    ----------------------------------------------------- */

    {
  key: "passport",

  header: "Passport",

  hideOnMobile: true,

  cell: (candidate) => {
    const isCopied =
      copiedPassportId === candidate.id;

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleCopyPassport(candidate);
        }}
        disabled={!candidate.passport_no}
        className={`
          group flex max-w-full items-center gap-1.5
          rounded-sm text-left
          transition-all duration-200
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          disabled:cursor-default
          disabled:opacity-50
          ${isCopied ? "animate-pulse" : ""}
        `}
        title={
          isCopied
            ? "Copied"
            : "Copy passport number"
        }
      >
        <span
          className={`
            block truncate
            transition-all duration-200
            ${
              isCopied
                ? "font-medium opacity-70"
                : ""
            }
          `}
        >
          {candidate.passport_no ?? "—"}
        </span>

        {candidate.passport_no && (
          <span
            className={`
              shrink-0 transition-all duration-200
              ${
                isCopied
                  ? "text-green-600"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
              }
            `}
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
  },
},


    /* -----------------------------------------------------
       COUNTRY
    ----------------------------------------------------- */

    {
      key: "country",

      header: "Country",

      hideOnMobile: true,

      cell: (candidate) => (

        <span className="block truncate">
          {candidate.country ?? "—"}
        </span>

      ),
    },


    /* -----------------------------------------------------
       STAGE
       -----------------------------------------------------
       Global Candidate stage.

       Example:
         Candidate
         Medical
         MOFA
         Visa
         Flight

    ----------------------------------------------------- */

   {
      key: "stage",
      header: "Stage",
      cell: (candidate) => (
        <CandidateStageBadge
          candidate={candidate}
          onOpenManageService={() => onManageServices?.(candidate)}
          onCandidateUpdated={(updated) => onCandidateUpdated?.(updated)}
        />
        /* Current stage-এ click করলে সরাসরি সেই module-এর sheet
           খোলে (Manage Service-এর ভেতর দিয়ে না) — nothing-started
           বা frozen candidate হলে Manage Service-এ fallback করে।
           Hover-এ tooltip current module-এর live status দেখায়। */
      ),
    },

    /* -----------------------------------------------------
       RECEIVED
    ----------------------------------------------------- */

    {
      key: "received",

      header: "Received",

      hideOnMobile: true,

      cell: (candidate) =>
        candidate.received_date ?? "—",
    },


    /* -----------------------------------------------------
       AGENT
    ----------------------------------------------------- */

    {
      key: "agent",

      header: "Agent",

      className: "w-[180px]",

      hideOnMobile: true,

      cell: (candidate) =>

        candidate.agent ? (

          <div className="flex min-w-0 flex-col">

            <span className="truncate font-medium">
              {candidate.agent.name ??
                "Unnamed Agent"}
            </span>

            

          </div>

        ) : (

          <span className="text-muted-foreground">
            —
          </span>

        ),
    },


    /* =====================================================
       STATUS
       ===================================================== */

    {
      key: "status",

      header: "Status",

      className: "w-[120px]",

      cell: (candidate) => {

        const status =
          getCandidateOverallStatus(
            candidate,
            {
              moduleStatus:
                candidate.workflow_state ?? null,
            },
          );


        /* -----------------------------------------------
           RETURNED
        ----------------------------------------------- */

        if (
          status === "returned"
        ) {

          return (

            <Tooltip>

              <TooltipTrigger asChild>

                <Badge
                  variant="destructive"
                  className="cursor-help"
                >
                  Returned
                </Badge>

              </TooltipTrigger>


              <TooltipContent>

                <p>

                  Returned date:{" "}

                  {candidate.returned_date

                    ? new Date(
                        candidate.returned_date,
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )

                    : "Not available"}

                </p>


                {candidate.returned_reason && (

                  <p className="mt-1">

                    Reason:{" "}
                    {candidate.returned_reason}

                  </p>

                )}

              </TooltipContent>

            </Tooltip>

          );
        }


        /* -----------------------------------------------
           CANCELLED
        ----------------------------------------------- */

        if (
          status === "cancelled"
        ) {

          return (

            <Tooltip>

              <TooltipTrigger asChild>

                <Badge
                  variant="secondary"
                  className="cursor-help"
                >
                  Cancelled
                </Badge>

              </TooltipTrigger>


              {candidate.final_reason && (

                <TooltipContent>

                  <p>
                    Reason:{" "}
                    {candidate.final_reason}
                  </p>

                </TooltipContent>

              )}

            </Tooltip>

          );
        }


        /* -----------------------------------------------
           COMPLETE
        ----------------------------------------------- */

        if (
          status === "complete"
        ) {

          return (

            <Badge variant="outline">
              Complete
            </Badge>

          );
        }


        /* -----------------------------------------------
           ACTIVE
        ----------------------------------------------- */

        return (

          <Badge variant="default">
            Active
          </Badge>

        );
      },
    },


    /* =====================================================
       ACTION
       ===================================================== */

    {
      key: "action",

      header: "Action",

      className:
        "w-[70px] text-right",

      cell: (candidate) => {

        const status =
          getCandidateOverallStatus(
            candidate,
            {
              moduleStatus:
                candidate.workflow_state ?? null,
            },
          );


        const isReturned =
          status === "returned";

        const isCancelled =
          status === "cancelled";

        const isComplete =
          status === "complete";


        return (

          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <Button
                variant="ghost"
                size="icon"
                type="button"
              >

                <MoreHorizontal />

                <span className="sr-only">
                  Open candidate actions
                </span>

              </Button>

            </DropdownMenuTrigger>


            <DropdownMenuContent align="end">

              {/* =========================================
                  PASSPORT
              ========================================= */}

              <DropdownMenuItem
                onClick={() =>
                  onPassportAction?.(
                    candidate,
                  )
                }
              >

                <FileText />

                Passport

              </DropdownMenuItem>


              {/* =========================================
                  EDIT
              ========================================= */}

              {!isComplete && (

                <DropdownMenuItem
                  onClick={() =>
                    onEdit?.(
                      candidate,
                    )
                  }
                >

                  <Pencil />

                  Edit

                </DropdownMenuItem>

              )}
              {!isComplete && (
             <DropdownMenuItem onClick={() => onManageServices?.(candidate)}>
                  <ListChecks />
                  Manage Services
                </DropdownMenuItem>
              )}

              {/* =========================================
                  RETURN
              ========================================= */}

              {!isReturned &&
                !isCancelled &&
                !isComplete && (

                  <DropdownMenuItem
                    onClick={() =>
                      onReturn?.(
                        candidate,
                      )
                    }
                  >

                    <RotateCcw />

                    Mark as Returned

                  </DropdownMenuItem>

                )}


              {/* =========================================
                  RESTORE RETURNED
              ========================================= */}

              {isReturned && (

                <DropdownMenuItem
                  onClick={() =>
                    onRestore?.(
                      candidate,
                    )
                  }
                >

                  <RotateCcw />

                  Restore Candidate

                </DropdownMenuItem>

              )}


              {/* =========================================
                  CANCEL
              ========================================= */}

              {!isReturned &&
                !isCancelled &&
                !isComplete && (

                  <DropdownMenuItem
                    onClick={() =>
                      onCancel?.(
                        candidate,
                      )
                    }
                  >

                    <Ban />

                    Cancel Candidate

                  </DropdownMenuItem>

                )}


              {/* =========================================
                  REACTIVATE
              ========================================= */}

              {isCancelled && (

                <DropdownMenuItem
                  onClick={() =>
                    onReactivate?.(
                      candidate,
                    )
                  }
                >

                  <PlayCircle />

                  Reactivate Candidate

                </DropdownMenuItem>

              )}


              {/* =========================================
                  DELETE
              ========================================= */}

              <DropdownMenuSeparator />


              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  onDelete?.(
                    candidate,
                  )
                }
              >

                <Trash2 />

                Delete

              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>

        );
      },
    },
  ];


  /* =======================================================
     TABLE
  ======================================================= */

  return (

    <TooltipProvider>

      <DataTable

        columns={columns}

        data={candidates}

        getRowKey={(candidate) =>
          candidate.id
        }

        loading={loading}

        emptyTitle="No candidates found"

        emptyDescription="Try changing your search."

        pageSize={pageSize}

        page={page}

        onPageChange={
          onPageChange
        }

        total={total}

        serverPagination={
          typeof total === "number" &&
          total !== candidates.length
        }

      />

    </TooltipProvider>

  );
}
