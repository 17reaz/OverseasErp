
import {
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Ban,
  PlayCircle,
  ListChecks,
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
import { getCandidateStageLabel } from "../candidate-stage";
import { CandidateNextStageButton } from "./candidate-next-stage-button";
import type { ModuleStatus } from "../profile/types";
import { MODULES } from "../profile/module-configs";

type CandidateModuleStatusSummary = {
  status: ModuleStatus;
  recordExists: boolean;
};

type CandidateModuleStatusMap = Record<
  string,
  Record<string, CandidateModuleStatusSummary>
>;


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

  onStageClick?: (candidate: Candidate) => void;
  moduleStatuses?: CandidateModuleStatusMap;
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
  onStageClick,
  moduleStatuses = {},
}: CandidatesTableProps) {


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

      cell: (candidate) => (

        <span className="block truncate">
          {candidate.passport_no}
        </span>

      ),
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
      cell: (candidate) => {
        const stageModule = candidate.current_stage
          ? MODULES.find(
              (module) => module.key === candidate.current_stage,
            )
          : null;

        const moduleStatus = stageModule
          ? moduleStatuses[candidate.id]?.[stageModule.key]
          : undefined;

        const statusLabel = moduleStatus
          ? moduleStatus.recordExists
            ? moduleStatus.status === "not_started"
              ? "Not started"
              : moduleStatus.status.charAt(0).toUpperCase() +
                moduleStatus.status.slice(1)
            : "No record"
          : null;

        return (
          <div className="flex min-w-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!stageModule}
              className="h-auto min-w-0 max-w-full justify-start px-2 py-1 text-xs font-medium"
              onClick={(event) => {
                event.stopPropagation();

                if (stageModule) {
                  onStageClick?.(candidate);
                }
              }}
            >
              {getCandidateStageLabel(candidate.current_stage)}
            </Button>

            {stageModule && statusLabel && (
              <>
                <span className="shrink-0 text-muted-foreground">·</span>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[11px]"
                >
                  {statusLabel}
                </Badge>
              </>
            )}
          </div>
        );
      },
    },

    // === নতুন কলাম ===
    {
      key: "next_stage",
      header: "Next",
      cell: (candidate) => (
        <CandidateNextStageButton
          candidate={candidate}
          onSuccess={(updated) => onCandidateUpdated?.(updated)}
        />
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
