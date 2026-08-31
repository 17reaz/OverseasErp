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
          gap-4
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
              h-56
              animate-pulse
              rounded-xl
              border
              bg-muted/40
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
          min-h-[300px]
          items-center
          justify-center
          rounded-xl
          border
          border-dashed
          bg-muted/10
        "
      >

        <div
          className="
            text-center
          "
        >

          <UserRound
            className="
              mx-auto
              h-10
              w-10
              text-muted-foreground
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
            Try changing your search
            or filter.
          </p>

        </div>

      </div>

    );

  }


  /* =======================================================
     CARD
  ======================================================= */

  return (

    <div
      className="
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
        xl:grid-cols-3
      "
    >

      {candidates.map(
        (candidate) => {

          /* -----------------------------------------------
             BASIC DATA
          ----------------------------------------------- */

          const fullName =
            candidate.name ||
            "Unknown candidate";


          const initials =
            fullName
              .split(" ")
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


          /* -----------------------------------------------
             OVERALL STATUS

             Same status contract as CandidatesTable.
          ----------------------------------------------- */

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

            <div
              key={
                candidate.id
              }
              className="
                group
                flex
                min-h-[235px]
                flex-col
                rounded-xl
                border
                bg-card
                p-5
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >

              {/* =========================================
                  CARD HEADER
              ========================================= */}

              <div
                className="
                  flex
                  items-start
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
                      h-10
                      w-10
                      shrink-0
                    "
                  >

                    <AvatarFallback
                      className="
                        text-xs
                        font-semibold
                      "
                    >
                      {initials}
                    </AvatarFallback>

                  </Avatar>


                  <div
                    className="
                      min-w-0
                    "
                  >

                    <h3
                      className="
                        truncate
                        text-sm
                        font-semibold
                      "
                    >
                      {fullName}
                    </h3>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-xs
                        text-muted-foreground
                      "
                    >
                      Passport:{" "}
                      {candidate.passport_no ||
                        "N/A"}
                    </p>

                  </div>

                </div>


                {/* =========================================
                    ACTION MENU
                ========================================= */}

                <DropdownMenu>

                  <DropdownMenuTrigger
                    asChild
                  >

                    <Button
                      variant="ghost"
                      size="icon"
                      className="
                        h-8
                        w-8
                        shrink-0
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
                    className="
                      w-48
                    "
                  >

                    {/* =====================================
                        EDIT

                        Same rule as table:
                        Complete candidate cannot be edited.
                    ===================================== */}

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


                    {/* =====================================
                        RETURN

                        Only active candidates.
                    ===================================== */}

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


                    {/* =====================================
                        RESTORE RETURNED
                    ===================================== */}

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


                    {/* =====================================
                        CANCEL

                        Only active candidates.
                    ===================================== */}

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


                    {/* =====================================
                        REACTIVATE CANCELLED
                    ===================================== */}

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


                    {/* =====================================
                        DELETE
                    ===================================== */}

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


              {/* =========================================
                  CARD BODY
              ========================================= */}

              <div
                className="
                  mt-5
                  space-y-4
                "
              >

                {/* AGENT */}

                <div>

                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    Agent
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-sm
                      font-medium
                    "
                  >
                    {agentName}
                  </p>

                </div>


                {/* STAGE + STATUS */}

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
                      min-w-0
                    "
                  >

                    <p
                      className="
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-muted-foreground
                      "
                    >
                      Stage
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


                  {/* STATUS */}

                  <span
                    className={`
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-full
                      px-2.5
                      py-1
                      text-xs
                      font-medium

                      ${
                        isReturned
                          ? `
                            bg-destructive/10
                            text-destructive
                          `
                          : isCancelled
                            ? `
                              bg-muted
                              text-muted-foreground
                            `
                            : isComplete
                              ? `
                                bg-primary/10
                                text-primary
                              `
                              : `
                                bg-emerald-500/10
                                text-emerald-600
                                dark:text-emerald-400
                              `
                      }
                    `}
                  >

                    <span
                      className={`
                        h-1.5
                        w-1.5
                        rounded-full

                        ${
                          isReturned
                            ? "bg-destructive"
                            : isCancelled
                              ? "bg-muted-foreground"
                              : isComplete
                                ? "bg-primary"
                                : "bg-emerald-500"
                        }
                      `}
                    />

                    {isReturned
                      ? "Returned"
                      : isCancelled
                        ? "Cancelled"
                        : isComplete
                          ? "Complete"
                          : "Active"}

                  </span>

                </div>


                {/* COUNTRY */}

                <div>

                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    Country
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-sm
                    "
                  >
                    {country}
                  </p>

                </div>

              </div>


              {/* =========================================
                  CARD FOOTER
              ========================================= */}

              <div
                className="
                  mt-auto
                  flex
                  items-center
                  justify-between
                  border-t
                  pt-4
                "
              >

                <span
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Candidate
                </span>


                <Button
                  variant="ghost"
                  size="sm"
                  className="
                    h-8
                    px-2
                    text-xs
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

        },
      )}

    </div>

  );

}
