import {
  BadgeCheck,
  CalendarDays,
  FileText,
  MoreHorizontal,
  Pencil,
  Stethoscope,
  Trash2,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  type Mofa,
  type MofaStage,
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
  stage: MofaStage,
) {

  switch (stage) {

    case "new":
      return "New";

    case "medupdated":
      return "Medical Updated";

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


function getStageVariant(
  stage: MofaStage,
): "default" | "secondary" | "destructive" | "outline" {

  switch (stage) {

    case "approved":
      return "default";

    case "medupdated":
      return "secondary";

    case "canceled":
    case "invalid":
      return "destructive";

    case "expired":
      return "outline";

    case "new":
    default:
      return "secondary";
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
                  w-[220px]
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
                  w-[130px]
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
                Trade
              </th>


              <th
                className="
                  w-[170px]
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
                  w-[140px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Medical
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
                Stage
              </th>


              <th
                className="
                  w-[100px]
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
          overflow-x-auto
        "
      >

        {loading ? (

          <div
            className="
              flex
              min-h-[240px]
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
              min-h-[240px]
              items-center
              justify-center
            "
          >

            <div
              className="
                text-center
              "
            >

              <FileText
                className="
                  mx-auto
                  mb-3
                  h-8
                  w-8
                  text-muted-foreground
                "
              />

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
                Create a MOFA application
                to get started.
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
                ) => (

                  <tr
                    key={mofa.id}
                    className="
                      border-b
                      hover:bg-muted/40
                    "
                  >

                    {/* ==================================================
                        SL
                        ================================================== */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        text-sm
                      "
                    >
                      {mofa.sl}
                    </td>


                    {/* ==================================================
                        CANDIDATE
                        ================================================== */}

                    <td
                      className="
                        w-[220px]
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

                          <FileText
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
                              mofa.candidate
                                ?.name ??
                              "Unknown Candidate"
                            }
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* ==================================================
                        PASSPORT
                        ================================================== */}

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
                          mofa.candidate
                            ?.passport_no ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* ==================================================
                        APPLICATION
                        ================================================== */}

                    <td
                      className="
                        w-[180px]
                        px-4
                        py-3
                      "
                    >

                      <span
                        className="
                          block
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {
                          mofa.application_number
                        }
                      </span>

                    </td>


                    {/* ==================================================
                        DATE
                        ================================================== */}

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
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <CalendarDays
                          className="
                            h-4
                            w-4
                            shrink-0
                            text-muted-foreground
                          "
                        />

                        {
                          mofa.application_date
                        }

                      </span>

                    </td>


                    {/* ==================================================
                        TRADE
                        ================================================== */}

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
                          mofa.trade ||
                          "—"
                        }
                      </span>

                    </td>


                    {/* ==================================================
                        AGENCY
                        ================================================== */}

                    <td
                      className="
                        w-[170px]
                        px-4
                        py-3
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
                              text-sm
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
                            text-sm
                            text-muted-foreground
                          "
                        >
                          —
                        </span>

                      )}

                    </td>


                    {/* ==================================================
                        MEDICAL
                        ================================================== */}

                    <td
                      className="
                        w-[140px]
                        px-4
                        py-3
                      "
                    >

                      {mofa.medical ? (

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <Stethoscope
                            className="
                              h-4
                              w-4
                              text-muted-foreground
                            "
                          />

                          <div>

                            <p
                              className="
                                text-sm
                                font-medium
                              "
                            >
                              Connected
                            </p>

                            <p
                              className="
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {
                                mofa.medical.status
                              }
                            </p>

                          </div>

                        </div>

                      ) : (

                        <span
                          className="
                            text-xs
                            text-muted-foreground
                          "
                        >
                          Not connected
                        </span>

                      )}

                    </td>


                    {/* ==================================================
                        STAGE
                        ================================================== */}

                    <td
                      className="
                        w-[140px]
                        px-4
                        py-3
                      "
                    >

                      <Badge
                        variant={
                          getStageVariant(
                            mofa.stage,
                          )
                        }
                      >
                        {getStageLabel(
                          mofa.stage,
                        )}
                      </Badge>

                    </td>


                    {/* ==================================================
                        ACTION
                        ================================================== */}

                    <td
                      className="
                        w-[100px]
                        px-4
                        py-3
                        text-right
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-1
                        "
                      >

                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() =>
                            onEdit?.(
                              mofa,
                            )
                          }
                        >

                          <Pencil
                            className="
                              h-4
                              w-4
                            "
                          />

                          <span
                            className="sr-only"
                          >
                            Edit
                          </span>

                        </Button>


                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() =>
                            onDelete?.(
                              mofa,
                            )
                          }
                        >

                          <Trash2
                            className="
                              h-4
                              w-4
                            "
                          />

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

    </div>
  );
}