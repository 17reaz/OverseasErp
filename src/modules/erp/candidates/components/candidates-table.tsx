import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Link,
} from "react-router-dom";

import {
  Button,
} from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  Candidate,
} from "../candidate-service";


interface CandidatesTableProps {
  candidates: Candidate[];

  loading?: boolean;

  page?: number;

  pageSize?: number;

  total?: number;

  onPageChange?: (
    page: number,
  ) => void;
onDownloadPassport?: (
  candidate: Candidate,
) => void;
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
}


export function CandidatesTable({
  candidates,
  loading = false,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onEdit,
  onDelete,
  onReturn,
  onRestore,
}: CandidatesTableProps) {

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalItems =
    total ?? candidates.length;


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
          pageSize,
      ),
    );


  const currentPage =
    Math.min(
      page,
      totalPages,
    );


  const startItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) *
          pageSize +
        1;


  const endItem =
    Math.min(
      currentPage *
        pageSize,
      totalItems,
    );


  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="
        flex
        h-[calc(100vh-250px)]
        min-h-[400px]
        flex-col
        overflow-hidden
        rounded-lg
        border
        bg-background
      "
    >

      {/* ==================================================
          TABLE HEADER
          ================================================== */}

      <div
        className="
          shrink-0
          border-b
          bg-background
        "
      >

        <table
          className="
            w-full
            table-fixed
          "
        >

          <thead>

            <tr>

              {/* SL */}

              <th
                className="
                  w-[70px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                SL
              </th>


              {/* CANDIDATE */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Candidate
              </th>


              {/* PASSPORT */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Passport
              </th>


              {/* COUNTRY */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Country
              </th>


              {/* STAGE */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Stage
              </th>


              {/* RECEIVED */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Received
              </th>


              {/* AGENT */}

              <th
                className="
                  w-[180px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Agent
              </th>


              {/* STATUS */}

              <th
                className="
                  w-[110px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Status
              </th>


              {/* ACTION */}

              <th
                className="
                  w-[70px]
                  px-4
                  py-3
                  text-right
                  text-sm
                  font-medium
                "
              >
                Action
              </th>

            </tr>

          </thead>

        </table>

      </div>


      {/* ==================================================
          TABLE BODY
          ================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
        "
      >

        {/* LOADING */}

        {loading ? (

          <div
            className="
              flex
              min-h-[200px]
              items-center
              justify-center
            "
          >

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >
              Loading candidates...
            </p>

          </div>

        ) : candidates.length === 0 ? (

          /* EMPTY */

          <div
            className="
              flex
              min-h-[200px]
              items-center
              justify-center
            "
          >

            <div
              className="
                text-center
              "
            >

              <p
                className="
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
                Try changing your search.
              </p>

            </div>

          </div>

        ) : (

          /* DATA */

          <table
            className="
              w-full
              table-fixed
            "
          >

            <tbody>

              {candidates.map(
                (
                  candidate,
                ) => (

                  <tr
                    key={
                      candidate.id
                    }
                    className="
                      border-b
                      hover:bg-muted/40
                    "
                  >

                    {/* =================================================
                        SL
                        ================================================= */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        text-sm
                      "
                    >
                      {candidate.sl ??
                        "—"}
                    </td>


                    {/* =================================================
                        CANDIDATE
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                      "
                    >

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

                    </td>


                    {/* =================================================
                        PASSPORT
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      <span
                        className="
                          block
                          truncate
                        "
                      >
                        {
                          candidate.passport_no
                        }
                      </span>

                    </td>


                    {/* =================================================
                        COUNTRY
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      <span
                        className="
                          block
                          truncate
                        "
                      >
                        {
                          candidate.country ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* =================================================
                        STAGE
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                      "
                    >

                      <span
                        className="
                          inline-flex
                          max-w-full
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                        "
                      >
                        {
                          candidate.current_stage ??
                          "Pending"
                        }
                      </span>

                    </td>


                    {/* =================================================
                        RECEIVED
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        text-sm
                      "
                    >
                      {
                        candidate.received_date ??
                        "—"
                      }
                    </td>


                    {/* =================================================
                        AGENT
                        ================================================= */}

                    <td
                      className="
                        w-[180px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {candidate.agent ? (

                        <div
                          className="
                            flex
                            min-w-0
                            flex-col
                          "
                        >

                          <span
                            className="
                              truncate
                              font-medium
                            "
                          >
                            {
                              candidate.agent.name ??
                              "Unnamed Agent"
                            }
                          </span>


                          {candidate.agent.code && (

                            <span
                              className="
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {
                                candidate.agent.code
                              }
                            </span>

                          )}

                        </div>

                      ) : (

                        <span
                          className="
                            text-muted-foreground
                          "
                        >
                          —
                        </span>

                      )}

                    </td>


                    {/* =================================================
                        STATUS
                        ================================================= */}

                    <td
  className="
    w-[110px]
    px-4
    py-3
  "
>
  {candidate.is_returned ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="
              inline-flex
              cursor-help
              rounded-full
              border
              px-2
              py-1
              text-xs
              font-medium
            "
          >
            Returned
          </span>
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span
      className="
        inline-flex
        rounded-full
        border
        px-2
        py-1
        text-xs
        font-medium
      "
    >
      Active
    </span>
  )}
</td>


                    {/* =================================================
                        ACTION
                        ================================================= */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        text-right
                      "
                    >

                      <DropdownMenu>

                        <DropdownMenuTrigger
                          asChild
                        >

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


                        <DropdownMenuContent
                          align="end"
                        >

<DropdownMenuItem
  onClick={() =>
    onDownloadPassport?.(
      candidate,
    )
  }
>
  <Download />

  Download Passport
</DropdownMenuItem>
                          {/* EDIT */}

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


                          {/* RETURN */}

                          {!candidate.is_returned && (

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


                          {/* RESTORE */}

                          {candidate.is_returned && (

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


                          <DropdownMenuSeparator />


                          {/* DELETE */}

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

                    </td>

                  </tr>

                ),
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* ==================================================
          FOOTER
          ================================================== */}

      <div
        className="
          shrink-0
          border-t
          bg-background
          px-4
          py-3
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <p
            className="
              text-sm
              text-muted-foreground
            "
          >

            {totalItems === 0
              ? "No results"
              : `${startItem}-${endItem} of ${totalItems}`}

          </p>


          <div
            className="
              flex
              items-center
              gap-1
            "
          >

            <Button
              variant="outline"
              size="icon"
              type="button"
              disabled={
                currentPage <= 1
              }
              onClick={() =>
                onPageChange?.(
                  currentPage - 1,
                )
              }
            >

              <ChevronLeft />

              <span className="sr-only">
                Previous page
              </span>

            </Button>


            <div
              className="
                px-3
                text-sm
              "
            >
              Page{" "}
              {currentPage}{" "}
              of{" "}
              {totalPages}
            </div>


            <Button
              variant="outline"
              size="icon"
              type="button"
              disabled={
                currentPage >=
                totalPages
              }
              onClick={() =>
                onPageChange?.(
                  currentPage + 1,
                )
              }
            >

              <ChevronRight />

              <span className="sr-only">
                Next page
              </span>

            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}