// src/modules/erp/shared/ui/data-table.tsx

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================================================
 * COLUMN DEFINITION
 * ========================================================= */

export interface DataTableColumn<T> {
  /** Unique key for the column (used as React key + width class target) */
  key: string;
  /** Header label */
  header: React.ReactNode;
  /** Cell renderer — receives the row and its index within the current page */
  cell: (row: T, index: number) => React.ReactNode;
  /** Applied to both <th> and <td> — widths, alignment, truncation etc. */
  className?: string;
  /** Hide this column on small screens */
  hideOnMobile?: boolean;
}

/* =========================================================
 * PROPS
 * ========================================================= */

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];

  /**
   * Full dataset in CLIENT mode, or just the current page's rows in
   * SERVER mode (see `serverPagination`).
   */
  data: T[];

  getRowKey: (row: T, index: number) => string | number;

  loading?: boolean;

  emptyTitle?: string;
  emptyDescription?: string;

  /* -----------------------------------------------------
   * PAGINATION
   *
   * CLIENT MODE (default): pass the full `data` array. The table
   * slices it internally using `pageSize`. Page state is
   * uncontrolled unless you pass `page` + `onPageChange`.
   *
   * SERVER MODE: set `serverPagination`, pass only the current
   * page's rows in `data`, and pass `total`, `page`, `onPageChange`
   * yourself (you own the fetch).
   * ----------------------------------------------------- */

  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  serverPagination?: boolean;
  /** Set false to hide the pagination footer entirely (still shows row count). */
  paginate?: boolean;

  /** Override the fixed-height scroll container, e.g. inside a dialog. */
  className?: string;
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription,
  pageSize = 10,
  page: controlledPage,
  onPageChange,
  total,
  serverPagination = false,
  paginate = true,
  className,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = React.useState(1);

  const page = controlledPage ?? internalPage;

  function goToPage(next: number) {
    if (onPageChange) {
      onPageChange(next);
    } else {
      setInternalPage(next);
    }
  }

  // Reset to page 1 whenever the underlying dataset shrinks below the
  // current page (e.g. after a filter change) — client mode only.
  React.useEffect(() => {
    if (serverPagination) return;

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

    if (page > totalPages) {
      goToPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, pageSize, serverPagination]);

  const totalItems = serverPagination ? (total ?? data.length) : data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const rows = serverPagination
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={
        className ??
        "flex h-[calc(100vh-250px)] min-h-[400px] flex-col overflow-hidden rounded-lg border bg-background"
      }
    >
      {/* ===================================================
          BODY
          =================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={[
                    column.hideOnMobile ? "hidden sm:table-cell" : "",
                    column.className ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={
                        column.hideOnMobile ? "hidden sm:table-cell" : ""
                      }
                    >
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <p className="text-sm font-medium">{emptyTitle}</p>

                  {emptyDescription && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {emptyDescription}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={getRowKey(row, index)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={[
                        column.hideOnMobile ? "hidden sm:table-cell" : "",
                        column.className ?? "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ===================================================
          FOOTER — count + pagination
          =================================================== */}

      <div className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading..."
            : totalItems === 0
              ? "No results"
              : `${startItem}-${endItem} of ${totalItems}`}
        </p>

        {paginate && totalItems > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft />
              <span className="sr-only">Previous page</span>
            </Button>

            <div className="px-3 text-sm">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}