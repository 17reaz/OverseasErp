import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

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

  onEdit?: (
    candidate: Candidate,
  ) => void;

  onDelete?: (
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
}: CandidatesTableProps) {

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


  return (
    <div className="flex h-[calc(100vh-250px)] min-h-[400px] flex-col overflow-hidden rounded-lg border bg-background">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="shrink-0 border-b bg-background">

        <table className="w-full table-fixed">

          <thead>
            <tr>

              <th className="w-[70px] px-4 py-3 text-left text-sm font-medium">
                SL
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Candidate
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Passport
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Country
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Stage
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium">
                Received
              </th>

              <th className="w-[100px] px-4 py-3 text-left text-sm font-medium">
                Agent
              </th>

              <th className="w-[100px] px-4 py-3 text-left text-sm font-medium">
                Status
              </th>

              <th className="w-[70px] px-4 py-3 text-right text-sm font-medium">
                Action
              </th>

            </tr>
          </thead>

        </table>

      </div>


      {/* ==================================================
          DATA
          ================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">

        {loading ? (

          <div className="flex min-h-[200px] items-center justify-center">

            <p className="text-sm text-muted-foreground">
              Loading candidates...
            </p>

          </div>

        ) : candidates.length === 0 ? (

          <div className="flex min-h-[200px] items-center justify-center">

            <div className="text-center">

              <p className="text-sm font-medium">
                No candidates found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing your search.
              </p>

            </div>

          </div>

        ) : (

          <table className="w-full table-fixed">

            <tbody>

              {candidates.map(
                (candidate) => (

                  <tr
                    key={
                      candidate.id
                    }
                    className="border-b hover:bg-muted/40"
                  >

                    {/* SL */}

                    <td className="w-[70px] px-4 py-3 text-sm">
                      {candidate.sl ??
                        "—"}
                    </td>


                    {/* NAME */}

                    <td className="px-4 py-3">

                      <Link
                        to={`/app/candidates/${candidate.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {candidate.name}
                      </Link>

                    </td>


                    {/* PASSPORT */}

                    <td className="px-4 py-3 text-sm">

                      <span className="block truncate">
                        {
                          candidate.passport_no
                        }
                      </span>

                    </td>


                    {/* COUNTRY */}

                    <td className="px-4 py-3 text-sm">

                      <span className="block truncate">
                        {
                          candidate.country ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* STAGE */}

                    <td className="px-4 py-3">

                      <span className="inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium">

                        {
                          candidate.current_stage ??
                          "Pending"
                        }

                      </span>

                    </td>


                    {/* RECEIVED */}

                    <td className="px-4 py-3 text-sm">
                      {
                        candidate.received_date ??
                        "—"
                      }
                    </td>


                    {/* AGENT */}

                    <td className="w-[100px] px-4 py-3 text-sm">

                      {candidate.agent_id
                        ? "Assigned"
                        : "—"}

                    </td>


                    {/* STATUS */}

                    <td className="w-[100px] px-4 py-3">

                      {candidate.is_returned ? (

                        <span className="inline-flex rounded-full border px-2 py-1 text-xs">
                          Returned
                        </span>

                      ) : (

                        <span className="inline-flex rounded-full border px-2 py-1 text-xs">
                          Active
                        </span>

                      )}

                    </td>


                    {/* ACTION */}

                    <td className="w-[70px] px-4 py-3 text-right">

                      <DropdownMenu>

                        <DropdownMenuTrigger
                          asChild
                        >

                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal />
                          </Button>

                        </DropdownMenuTrigger>


                        <DropdownMenuContent
                          align="end"
                        >

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

      <div className="shrink-0 border-t bg-background px-4 py-3">

        <div className="flex items-center justify-between">

          <p className="text-sm text-muted-foreground">

            {totalItems === 0
              ? "No results"
              : `${startItem}-${endItem} of ${totalItems}`}

          </p>


          <div className="flex items-center gap-1">

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
            </Button>


            <div className="px-3 text-sm">
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
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}