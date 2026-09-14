import {
  Check,
  FileCheck2,
  X,
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


function BooleanBadge({
  value,
}: {
  value: boolean;
}) {
  return (
    <span
      className={`
        inline-flex
        h-6
        w-6
        items-center
        justify-center
        rounded-full
        ${
          value
            ? "bg-emerald-500/15 text-emerald-600"
            : "bg-red-500/15 text-red-600"
        }
      `}
    >
      {value ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
    </span>
  );
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
                  w-[60px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                SL
              </th>


              {/* NAME */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Name
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


              {/* FIT DATE */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Fit Date
              </th>


              {/* MOFA */}

              <th
                className="
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                MOFA
              </th>


              {/* PC */}

              <th
                className="
                  w-[70px]
                  px-4
                  py-3
                  text-center
                  text-sm
                  font-medium
                "
              >
                PC
              </th>


              {/* FINGER */}

              <th
                className="
                  w-[80px]
                  px-4
                  py-3
                  text-center
                  text-sm
                  font-medium
                "
              >
                Finger
              </th>


              {/* ACTION */}

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
                Every approved MOFA already has
                a visa.
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
                        w-[60px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {item.candidate.sl ??
                        index + 1}

                    </td>


                    {/* =================================================
                        NAME
                        ================================================= */}

                    <td
                      className="
                        px-4
                        py-3
                        text-sm
                        font-medium
                      "
                    >

                      <span
                        className="
                          block
                          truncate
                        "
                      >
                        {
                          item.candidate.name
                        }
                      </span>

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
                        FIT DATE
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
                          item.fit_date ??
                          "—"
                        }
                      </span>

                    </td>


                    {/* =================================================
                        MOFA
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
                        PC
                        ================================================= */}

                    <td
                      className="
                        w-[70px]
                        px-4
                        py-3
                        text-center
                      "
                    >

                      <BooleanBadge
                        value={
                          item.police_clearance_verified
                        }
                      />

                    </td>


                    {/* =================================================
                        FINGER
                        ================================================= */}

                    <td
                      className="
                        w-[80px]
                        px-4
                        py-3
                        text-center
                      "
                    >

                      <BooleanBadge
                        value={
                          item.finger_completed
                        }
                      />

                    </td>


                    {/* =================================================
                        ACTION
                        ================================================= */}

                    <td
                      className="
                        w-[110px]
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
