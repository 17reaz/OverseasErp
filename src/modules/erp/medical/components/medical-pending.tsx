import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  MedicalCandidate,
} from "../medical-service";

interface MedicalPendingProps {
  candidates: MedicalCandidate[];

  loading?: boolean;

  page?: number;

  pageSize?: number;

  total?: number;

  onPageChange?: (
    page: number,
  ) => void;

  onAddMedical?: (
    candidate: MedicalCandidate,
  ) => void;
}

export function MedicalPending({
  candidates,
  loading = false,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onAddMedical,
}: MedicalPendingProps) {

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


              {/* ACTION */}

              <th
                className="
                  w-[120px]
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

        {/* ==================================================
            LOADING
            ================================================== */}

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
              Loading medicalable candidates...
            </p>

          </div>

        ) : candidates.length === 0 ? (

          /* ==================================================
              EMPTY
              ================================================== */

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
                No candidates waiting for medical
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                All available candidates already have
                a medical record.
              </p>

            </div>

          </div>

        ) : (

          /* ==================================================
              DATA
              ================================================== */

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
                  index,
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
                        (currentPage -
                          1) *
                          pageSize +
                          index +
                          1}
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

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2
                        "
                      >

                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            bg-muted/30
                          "
                        >

                          <Stethoscope
                            className="
                              h-4
                              w-4
                              text-muted-foreground
                            "
                          />

                        </div>


                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {
                              candidate.name
                            }
                          </p>

                        </div>

                      </div>

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
                        RECEIVED
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {candidate.received_date ? (

                        <span
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <CalendarDays
                            className="
                              h-4
                              w-4
                              text-muted-foreground
                            "
                          />

                          {
                            candidate.received_date
                          }

                        </span>

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
                        ACTION
                        ================================================= */}

                    <td
                      className="
                        w-[120px]
                        px-4
                        py-3
                        text-right
                      "
                    >

                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() =>
                          onAddMedical?.(
                            candidate,
                          )
                        }
                      >

                        <Stethoscope
                          className="
                            mr-2
                            h-4
                            w-4
                          "
                        />

                        Medical

                      </Button>

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

              <span
                className="sr-only"
              >
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

              <span
                className="sr-only"
              >
                Next page
              </span>

            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}