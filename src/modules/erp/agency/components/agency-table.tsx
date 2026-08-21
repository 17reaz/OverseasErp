import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  Agency,
} from "../agency-service";


interface AgencyTableProps {
  agencies: Agency[];

  loading?: boolean;

  page?: number;

  pageSize?: number;

  total?: number;

  onPageChange?: (
    page: number,
  ) => void;

  onEdit?: (
    agency: Agency,
  ) => void;

  onDelete?: (
    agency: Agency,
  ) => void;
}


export function AgencyTable({
  agencies,
  loading = false,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: AgencyTableProps) {

  const totalItems =
    total ?? agencies.length;

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
                Code
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
                Contact
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
                Email
              </th>

              <th
                className="
                  w-[120px]
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-medium
                "
              >
                Status
              </th>

              <th
                className="
                  w-[130px]
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
              Loading agencies...
            </p>

          </div>

        ) : agencies.length === 0 ? (

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
                No agencies found
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Create an agency to get started.
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

              {agencies.map(
                (
                  agency,
                  index,
                ) => (

                  <tr
                    key={
                      agency.id
                    }
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
                      {agency.sl ??
                        (currentPage - 1) *
                          pageSize +
                          index +
                          1}
                    </td>


                    {/* ==================================================
                        AGENCY
                        ================================================== */}

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
                          gap-3
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

                          <Building2
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
                            {agency.name}
                          </p>


                          {agency.address && (
                            <p
                              className="
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                            >
                              {agency.address}
                            </p>
                          )}

                        </div>

                      </div>

                    </td>


                    {/* ==================================================
                        CODE
                        ================================================== */}

                    <td
                      className="
                        w-[140px]
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
                        {agency.code}
                      </span>
                    </td>


                    {/* ==================================================
                        PHONE
                        ================================================== */}

                    <td
                      className="
                        w-[170px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {agency.phone ? (

                        <div
                          className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                          "
                        >

                          <Phone
                            className="
                              h-4
                              w-4
                              shrink-0
                              text-muted-foreground
                            "
                          />

                          <span
                            className="
                              truncate
                            "
                          >
                            {agency.phone}
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


                    {/* ==================================================
                        EMAIL
                        ================================================== */}

                    <td
                      className="
                        w-[220px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      {agency.email ? (

                        <div
                          className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                          "
                        >

                          <Mail
                            className="
                              h-4
                              w-4
                              shrink-0
                              text-muted-foreground
                            "
                          />

                          <span
                            className="
                              truncate
                            "
                          >
                            {agency.email}
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


                    {/* ==================================================
                        STATUS
                        ================================================== */}

                    <td
                      className="
                        w-[120px]
                        px-4
                        py-3
                        text-sm
                      "
                    >

                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                          ${
                            agency.is_active
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {agency.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>


                    {/* ==================================================
                        ACTION
                        ================================================== */}

                    <td
                      className="
                        w-[130px]
                        px-4
                        py-3
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
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onEdit?.(
                              agency,
                            )
                          }
                          title="Edit agency"
                        >

                          <Pencil />

                          <span
                            className="sr-only"
                          >
                            Edit agency
                          </span>

                        </Button>


                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onDelete?.(
                              agency,
                            )
                          }
                          title="Delete agency"
                        >

                          <Trash2 />

                          <span
                            className="sr-only"
                          >
                            Delete agency
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