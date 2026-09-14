import {
  FileCheck2,
  FileText,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  VisaEligibleMofa,
} from "../visa-service";


interface VisaPendingProps {
  items: VisaEligibleMofa[];

  loading?: boolean;

  onAddVisa?: (
    item: VisaEligibleMofa,
  ) => void;
}


export function VisaPending({
  items,
  loading = false,
  onAddVisa,
}: VisaPendingProps) {

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


              {/* MOFA APPLICATION */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                MOFA App. No
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
              Loading visaable candidates...
            </p>

          </div>

        ) : items.length === 0 ? (

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
                No candidates waiting for visa
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Approved MOFA + completed fingerprint +
                verified police clearance, without a
                visa yet — none right now.
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

              {items.map(
                (
                  item,
                  index,
                ) => (

                  <tr
                    key={
                      item.id
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

                      {item.candidate.sl ??
                        index + 1}

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
                              item.candidate.name
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
                          item.candidate.passport_no
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
                          item.candidate.country ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* =================================================
                        MOFA APPLICATION
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
                          item.application_number ??
                          "—"
                        }
                      </span>

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

                      {item.candidate.agent ? (

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
                              item.candidate.agent.name ??
                              "Unnamed Agent"
                            }
                          </span>


                          {item.candidate.agent.code && (

                            <span
                              className="
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {
                                item.candidate.agent.code
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
                          onAddVisa?.(
                            item,
                          )
                        }
                      >

                        <FileCheck2
                          className="
                            mr-2
                            h-4
                            w-4
                          "
                        />

                        Visa

                      </Button>

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
