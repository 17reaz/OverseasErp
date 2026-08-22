import {
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Mofa } from "../mofa-service";

/* =========================================================
 * PROPS
 * ========================================================= */

interface MofaTableProps {
  mofas: Mofa[];
  loading?: boolean;

  onEdit?: (mofa: Mofa) => void;
  onDelete?: (mofa: Mofa) => void;
}

/* =========================================================
 * STAGE LABEL
 * ========================================================= */

function getStageLabel(
  stage: Mofa["stage"],
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

/* =========================================================
 * STAGE CLASS
 * ========================================================= */

function getStageClass(
  stage: Mofa["stage"],
) {
  switch (stage) {
    case "approved":
      return "border-foreground/20 bg-foreground/5";

    case "medupdated":
      return "border-border bg-muted";

    case "canceled":
      return "border-destructive/20 bg-destructive/5 text-destructive";

    case "expired":
      return "border-border bg-muted text-muted-foreground";

    case "invalid":
      return "border-destructive/20 bg-destructive/5 text-destructive";

    case "new":
    default:
      return "border-border bg-background";
  }
}

/* =========================================================
 * DATE FORMAT
 * ========================================================= */

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* =========================================================
 * TABLE
 * ========================================================= */

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
      {/* ===================================================
       * TABLE HEADER
       * =================================================== */}

      <div
        className="
          shrink-0
          border-b
          bg-muted/30
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
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                SL
              </th>

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                Trade
              </th>

              <th
                className="
                  w-[140px]
                  px-4
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
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
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                Action
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* ===================================================
       * TABLE BODY
       * =================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-x-hidden
          overflow-y-auto
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
            <div className="text-center">
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
                    key={mofa.id}
                    className="
                      border-b
                      transition-colors
                      hover:bg-muted/40
                    "
                  >
                    {/* =================================
                     * SL
                     * ================================= */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        align-middle
                        text-sm
                      "
                    >
                      {mofa.sl ?? index + 1}
                    </td>

                    {/* =================================
                     * CANDIDATE
                     * ================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        align-middle
                      "
                    >
                      <div className="min-w-0">
                        <p
                          className="
                            truncate
                            text-sm
                            font-medium
                          "
                        >
                          {mofa.candidate?.name ??
                            "Unknown candidate"}
                        </p>

                        {mofa.candidate?.agent?.name && (
                          <p
                            className="
                              mt-0.5
                              truncate
                              text-xs
                              text-muted-foreground
                            "
                          >
                            Agent:{" "}
                            {
                              mofa.candidate.agent.name
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    {/* =================================
                     * PASSPORT
                     * ================================= */}

                    <td
                      className="
                        w-[150px]
                        px-4
                        py-3
                        align-middle
                        text-sm
                      "
                    >
                      <span className="block truncate">
                        {mofa.candidate?.passport_no ??
                          "—"}
                      </span>
                    </td>

                    {/* =================================
                     * APPLICATION
                     * ================================= */}

                    <td
                      className="
                        w-[180px]
                        px-4
                        py-3
                        align-middle
                      "
                    >
                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {mofa.application_number ??
                          "—"}
                      </p>
                    </td>

                    {/* =================================
                     * DATE
                     * ================================= */}

                    <td
                      className="
                        w-[140px]
                        px-4
                        py-3
                        align-middle
                        text-sm
                      "
                    >
                      {mofa.application_date ? (
                        <div
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

                          <span>
                            {formatDate(
                              mofa.application_date,
                            )}
                          </span>
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

                    {/* =================================
                     * AGENCY
                     * ================================= */}

                    <td
                      className="
                        w-[150px]
                        px-4
                        py-3
                        align-middle
                      "
                    >
                      {mofa.agency ? (
                        <div className="min-w-0">
                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {mofa.agency.name}
                          </p>

                          {mofa.agency.code && (
                            <p
                              className="
                                mt-0.5
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {mofa.agency.code}
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

                    {/* =================================
                     * TRADE
                     * ================================= */}

                    <td
                      className="
                        w-[130px]
                        px-4
                        py-3
                        align-middle
                        text-sm
                      "
                    >
                      <span className="block truncate">
                        {mofa.trade ?? "—"}
                      </span>
                    </td>

                    {/* =================================
                     * STAGE
                     * ================================= */}

                    <td
                      className="
                        w-[140px]
                        px-4
                        py-3
                        align-middle
                      "
                    >
                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-md
                          border
                          px-2
                          py-1
                          text-xs
                          font-medium
                          ${getStageClass(
                            mofa.stage,
                          )}
                        `}
                      >
                        {getStageLabel(
                          mofa.stage,
                        )}
                      </span>
                    </td>

                    {/* =================================
                     * ACTION
                     * ================================= */}

                    <td
                      className="
                        w-[100px]
                        px-4
                        py-3
                        align-middle
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
                            onEdit?.(mofa)
                          }
                        >
                          <Pencil
                            className="
                              h-4
                              w-4
                            "
                          />

                          <span className="sr-only">
                            Edit MOFA
                          </span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onDelete?.(mofa)
                          }
                        >
                          <Trash2
                            className="
                              h-4
                              w-4
                            "
                          />

                          <span className="sr-only">
                            Delete MOFA
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

      {/* ===================================================
       * FOOTER
       * =================================================== */}

      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-t
          bg-background
          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          {mofas.length === 0
            ? "No results"
            : `${mofas.length} ${
                mofas.length === 1
                  ? "record"
                  : "records"
              }`}
        </p>
      </div>
    </div>
  );
}