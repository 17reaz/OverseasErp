import {
  Ban,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
  UserRound,
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

import {
  getCandidateOverallStatus,
} from "../candidate-selectors";


/* =========================================================
   PROPS
========================================================= */

interface CandidatesGridProps {
  candidates: Candidate[];

  loading?: boolean;

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
  onCancel: _onCancel,
  onReactivate,
}: CandidatesGridProps) {
  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="
              h-[210px]
              animate-pulse
              rounded-lg
              border
              bg-muted/30
            "
          />
        ))}
      </div>
    );
  }


  /* =======================================================
     EMPTY
  ======================================================= */

  if (candidates.length === 0) {
    return (
      <div
        className="
          flex
          min-h-[280px]
          items-center
          justify-center
          rounded-lg
          border
          border-dashed
          bg-muted/[0.03]
        "
      >
        <div className="text-center">
          <UserRound
            className="
              mx-auto
              h-9
              w-9
              text-muted-foreground/60
            "
          />

          <p
            className="
              mt-3
              text-sm
              font-medium
            "
          >
            No candidates found
          </p>

          <p
            className="
              mt-1
              text-xs
              text-muted-foreground
            "
          >
            Try changing your search or filter.
          </p>
        </div>
      </div>
    );
  }


  /* =======================================================
     GRID
  ======================================================= */

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-3
        md:grid-cols-2
        xl:grid-cols-3
      "
    >
      {candidates.map((candidate) => {
        /* ---------------------------------------------------
           BASIC DATA
        --------------------------------------------------- */

        const fullName =
          candidate.name ||
          "Unknown candidate";

        const initials =
          fullName
            .split(" ")
            .filter(Boolean)
            .map(
              (part) =>
                part.charAt(0),
            )
            .join("")
            .slice(0, 2)
            .toUpperCase();

        const agentName =
          candidate.agent?.name ||
          candidate.agent?.code ||
          "No agent";

        const stage =
          candidate.current_stage ||
          "Not assigned";

        const country =
          candidate.country ||
          "Country not set";


        /* ---------------------------------------------------
           STATUS
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           STATUS STYLING
        --------------------------------------------------- */

        const statusLabel =
          isReturned
            ? "Returned"
            : isCancelled
              ? "Cancelled"
              : isComplete
                ? "Complete"
                : "Active";

        const statusClass =
          isReturned
            ? "bg-destructive/10 text-destructive"
            : isCancelled
              ? "bg-muted text-muted-foreground"
              : isComplete
                ? "bg-primary/10 text-primary"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

        const statusDotClass =
          isReturned
            ? "bg-destructive"
            : isCancelled
              ? "bg-muted-foreground"
              : isComplete
                ? "bg-primary"
                : "bg-emerald-500";


        /* ---------------------------------------------------
           CARD
        --------------------------------------------------- */

        return (
          <div
            key={candidate.id}
            className="
              group
              flex
              min-h-[210px]
              flex-col
              rounded-lg
              border
              bg-card
              p-4
              shadow-none
              transition-colors
              hover:border-border/80
              hover:bg-muted/[0.02]
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >
                <Avatar
                  className="
                    h-9
                    w-9
                    shrink-0
                  "
                >
                  <AvatarFallback
                    className="
                      bg-muted
                      text-[11px]
                      font-semibold
                      text-muted-foreground
                    "
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3
                    className="
                      truncate
                      text-sm
                      font-semibold
                      leading-tight
                    "
                  >
                    {fullName}
                  </h3>

                  <p
                    className="
                      mt-1
                      truncate
                      text-[11px]
                      text-muted-foreground
                    "
                  >
                    {candidate.passport_no || "No passport"}
                  </p>
                </div>
              </div>


              {/* =================================================
                  ACTION MENU
              ================================================= */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="
                      h-8
                      w-8
                      shrink-0
                      text-muted-foreground
                      opacity-70
                      transition-opacity
                      hover:text-foreground
                      group-hover:opacity-100
                    "
                  >
                    <MoreHorizontal
                      className="
                        h-4
                        w-4
                      "
                    />

                    <span className="sr-only">
                      Candidate actions
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48"
                >
                  {/* EDIT */}

                  {!isComplete && (
                    <DropdownMenuItem
                      onClick={() =>
                        onEdit?.(
                          candidate,
                        )
                      }
                    >
                      <Pencil
                        className="
                          mr-2
                          h-4
                          w-4
                        "
                      />

                      Edit
                    </DropdownMenuItem>
                  )}


                  {/* RETURN */}

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
                        <RotateCcw
                          className="
                            mr-2
                            h-4
                            w-4
                          "
                        />

                        Return
                      </DropdownMenuItem>
                    )}


                  {/* RESTORE */}

                  {isReturned && (
                    <DropdownMenuItem
                      onClick={() =>
                        onRestore?.(
                          candidate,
                        )
                      }
                    >
                      <RotateCcw
                        className="
                          mr-2
                          h-4
                          w-4
                        "
                      />

                      Restore Candidate
                    </DropdownMenuItem>
                  )}


                  {/* CANCEL */}

                  {!isReturned &&
                    !isCancelled &&
                    !isComplete && (
                      <DropdownMenuItem
                        onClick={() =>
                          _onCancel?.(
                            candidate,
                          )
                        }
                      >
                        <Ban
                          className="
                            mr-2
                            h-4
                            w-4
                          "
                        />

                        Cancel Candidate
                      </DropdownMenuItem>
                    )}


                  {/* REACTIVATE */}

                  {isCancelled && (
                    <DropdownMenuItem
                      onClick={() =>
                        onReactivate?.(
                          candidate,
                        )
                      }
                    >
                      <PlayCircle
                        className="
                          mr-2
                          h-4
                          w-4
                        "
                      />

                      Reactivate Candidate
                    </DropdownMenuItem>
                  )}


                  {/* DELETE */}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() =>
                      onDelete?.(
                        candidate,
                      )
                    }
                    className="
                      text-destructive
                      focus:text-destructive
                    "
                  >
                    <Trash2
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>


            {/* =================================================
                DIVIDER
            ================================================= */}

            <div
              className="
                mt-4
                border-t
              "
            />


            {/* =================================================
                WORKFLOW INFO
            ================================================= */}

            <div
              className="
                mt-4
                space-y-3
              "
            >
              {/* STAGE */}

              <div
                className="
                  rounded-md
                  bg-muted/40
                  px-3
                  py-2.5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        text-[10px]
                        font-medium
                        uppercase
                        tracking-wider
                        text-muted-foreground
                      "
                    >
                      Current stage
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-sm
                        font-medium
                      "
                    >
                      {stage}
                    </p>
                  </div>

                  <span
                    className={`
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-full
                      px-2
                      py-1
                      text-[10px]
                      font-medium
                      ${statusClass}
                    `}
                  >
                    <span
                      className={`
                        h-1.5
                        w-1.5
                        rounded-full
                        ${statusDotClass}
                      `}
                    />

                    {statusLabel}
                  </span>
                </div>
              </div>


              {/* META */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    "
                  >
                    Agent
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-xs
                      font-medium
                    "
                  >
                    {agentName}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    "
                  >
                    Country
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-xs
                      font-medium
                    "
                  >
                    {country}
                  </p>
                </div>
              </div>
            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div
              className="
                mt-auto
                flex
                items-center
                justify-end
                pt-4
              "
            >
              <Button
                variant="ghost"
                size="sm"
                className="
                  h-7
                  px-2
                  text-xs
                  text-muted-foreground
                  hover:text-foreground
                "
                onClick={() =>
                  onEdit?.(
                    candidate,
                  )
                }
                disabled={isComplete}
              >
                View / Edit
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}