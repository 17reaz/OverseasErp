import {
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  Mofa,
} from "../mofa-service";

interface MofaTableProps {
  mofas: Mofa[];

  loading?: boolean;

  onEdit?: (
    mofa: Mofa,
  ) => void;

  onDelete?: (
    mofa: Mofa,
  ) => void;
}

function getStageLabel(
  stage: Mofa["stage"],
) {
  switch (stage) {
    case "new":
      return "New";

    case "medupdated":
      return "Med Updated";

    case "approved":
      return "Approved";

    case "canceled":
      return "Canceled";

    case "expired":
      return "Expired";

    case "invalid":
      return "Invalid";

    default:
      return stage;
  }
}

export function MofaTable({
  mofas,
  loading = false,
  onEdit,
  onDelete,
}: MofaTableProps) {

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
          HEADER
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


              <th
                className="
                  w-[150px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Passport
              </th>


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
                Application
              </th>


              <th
                className="
                  w-[140px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Date
              </th>


              <th
                className="
                  w-[150px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Agency
              </th>


              <th
                className="
                  w-[130px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Trade
              </th>


              <th
                className="
                  w-[130px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Stage
              </th>


              <th
                className="
                  w-[110px]
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
          BODY
          ================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
        "
      >

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
              Loading MOFA records...
            </p>

          </div>

        ) : mofas.length === 0 ? (

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
                No MOFA records found
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Create a MOFA record to see it here.
              </p>

            </div>

          </div>

        ) : (

          <table
            className="
              w-full
              table-fixed
            "
          >

            <tbody>

              {mofas.map(
                (
                  mofa,
                  index,
                ) => (

                  <tr
                    key={
                      mofa.id
                    }

                    className="
                      border-b
                      hover:bg-muted/40
                    "
                  >

                    {/* ====================================
                        SL
                        ==================================== */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        text-sm
                      "
                    >
                      {mofa.sl ??
                        index + 1}
                    </td>


                    {/* ====================================
                        CANDIDATE
                        ==================================== */}

                    <td
                      className="
                        px-4
                        py-3
                      "
                    >

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
                            mofa.candidate?.name ??
                            "Unknown candidate"
                          }
                        </p>


                        {mofa.candidate?.agent && (

                          <p
                            className="
                              truncate
                              text-xs
                              text-muted-foreground
                            "
                          >
                            {
                              mofa.candidate.agent.name
                            }
                          </p>

                        )}

                      </div>

                    </td>


                    {/* ====================================
                        PASSPORT
                        ==================================== */}

                    <td
                      className="
                        w-[150px]
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
                          mofa.candidate?.passport_no ??
                          "—"
                        }
                      </span>
                    </td>


                    {/* ====================================
                        APPLICATION
                        ==================================== */}

                    <td
                      className="
                        w-[180px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      <span
                        className="
                          block
                          truncate
                          font-medium
                        "
                      >
                        {
                          mofa.application_number ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* ====================================
                        DATE
                        ==================================== */}

                    <td
                      className="
                        w-[140px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {mofa.application_date ? (

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
                            mofa.application_date
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


                    {/* ====================================
                        AGENCY
                        ==================================== */}

                    <td
                      className="
                        w-[150px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {mofa.agency ? (

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              truncate
                              font-medium
                            "
                          >
                            {
                              mofa.agency.name
                            }
                          </p>


                          {mofa.agency.code && (

                            <p
                              className="
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {
                                mofa.agency.code
                              }
                            </p>

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


                    {/* ====================================
                        TRADE
                        ==================================== */}

                    <td
                      className="
                        w-[130px]
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
                          mofa.trade ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* ====================================
                        STAGE
                        ==================================== */}

                    <td
                      className="
                        w-[130px]
                        px-4
                        py-3
                      "
                    >

                      <span
                        className="
                          inline-flex
                          items-center
                          rounded-md
                          border
                          px-2
                          py-1
                          text-xs
                          font-medium
                        "
                      >
                        {
                          getStageLabel(
                            mofa.stage,
                          )
                        }
                      </span>

                    </td>


                    {/* ====================================
                        ACTION
                        ==================================== */}

                    <td
                      className="
                        w-[110px]
                        px-4
                        py-3
                      "
                    >

                      <div
                        className="
                          flex
                          justify-end
                          gap-1
                        "
                      >

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onEdit?.(
                              mofa,
                            )
                          }
                        >

                          <Pencil />

                          <span
                            className="sr-only"
                          >
                            Edit
                          </span>

                        </Button>


                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onDelete?.(
                              mofa,
                            )
                          }
                        >

                          <Trash2 />

                          <span
                            className="sr-only"
                          >
                            Delete
                          </span>

                        </Button>

                      </div>

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
            {mofas.length === 0
              ? "No results"
              : `${mofas.length} result${
                  mofas.length === 1
                    ? ""
                    : "s"
                }`}
          </p>

        </div>

      </div>

    </div>
  );
}