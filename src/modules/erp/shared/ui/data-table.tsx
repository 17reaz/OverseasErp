// src/modules/erp/shared/ui/data-table.tsx

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
 * CONSTANTS
 * ========================================================= */

const MotionTableRow = motion.create(TableRow);
const MotionCellContent = motion.div;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PAGE_TRANSITION_MS = 350;

const DEFAULT_CONTAINER_CLASS =
  "flex h-[calc(100dvh-250px)] min-h-[400px] flex-col overflow-hidden rounded-lg border bg-background";

const EMPTY_ROW_KEYS: Set<string | number> = new Set();
const EMPTY_FIELD_KEYS: Map<string, Set<string>> = new Map();

/* =========================================================
 * TYPES
 * ========================================================= */

type Direction = "next" | "previous" | null;

export interface DataTableColumn<T> {
  /** Unique key for the column (used as React key + width class target) */
  key: string;

  /** Field name used for update highlighting */
  fieldKey?: string;

  /** Header label */
  header: React.ReactNode;

  /** Cell renderer — receives the row and its index within the current page */
  cell: (row: T, index: number) => React.ReactNode;

  /** Applied to both <th> and <td> — widths, alignment, truncation etc. */
  className?: string;

  /** Hide this column on small screens */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];

  /**
   * Full dataset in CLIENT mode, or just the current page's rows in
   * SERVER mode (see `serverPagination`).
   */
  data: T[];

  newRowKeys?: Set<string | number>;
  updatedRowKeys?: Set<string | number>;
  updatedFieldKeys?: Map<string, Set<string>>;
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
 * HELPERS
 * ========================================================= */

/** Shared by <th> and <td>. */
function getColumnClassName<T>(column: DataTableColumn<T>): string {
  return [
    column.hideOnMobile ? "hidden sm:table-cell" : "",
    column.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Row enter / update / exit animation props. */
function getRowMotion({
  isNewRow,
  isUpdatedRow,
  isPageTransition,
  direction,
}: {
  isNewRow: boolean;
  isUpdatedRow: boolean;
  isPageTransition: boolean;
  direction: Direction;
}) {
  const isNext = direction === "next";

  return {
    initial: isNewRow
      ? { opacity: 0, x: 24 }
      : isPageTransition
        ? { opacity: 0, x: isNext ? 12 : -12 }
        : false,

    animate: isUpdatedRow
      ? { opacity: [1, 1, 1], scale: [1, 1.008, 1] }
      : { opacity: 1, x: 0, scale: 1 },

    exit: isPageTransition
      ? { opacity: 0, x: isNext ? -12 : 12 }
      : { opacity: 0, x: 24 },

    transition: {
      layout: { duration: 0.38, ease: EASE },

      opacity: isPageTransition
        ? { duration: 0.26, ease: EASE }
        : isNewRow
          ? { duration: 0.22, delay: 0.08 }
          : { duration: 0.18 },

      x: isPageTransition
        ? { duration: 0.28, ease: EASE }
        : isNewRow
          ? { duration: 0.42, delay: 0.08, ease: EASE }
          : { duration: 0.32, ease: EASE },

      scale: isUpdatedRow
        ? { duration: 0.7, ease: EASE }
        : { duration: 0.2 },
    },
  };
}

/** Per-cell highlight animation for updated fields. */
function getCellMotion(isFieldUpdated: boolean) {
  return {
    animate: isFieldUpdated
      ? { opacity: [0.55, 1], scale: [0.98, 1.02, 1] }
      : { opacity: 1, scale: 1 },

    transition: isFieldUpdated
      ? { duration: 0.55, ease: EASE }
      : { duration: 0.15 },
  };
}

/* =========================================================
 * SUB-COMPONENTS
 * ========================================================= */

function SkeletonRows<T>({
  columns,
  count,
}: {
  columns: DataTableColumn<T>[];
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {columns.map((column) => (
            <TableCell key={column.key} className={getColumnClassName(column)}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description?: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="text-sm text-muted-foreground">{title}</div>

        {description && (
          <div className="mt-1 text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function DataTableFooter({
  loading,
  totalItems,
  startItem,
  endItem,
  currentPage,
  totalPages,
  paginate,
  onPageChange,
}: {
  loading: boolean;
  totalItems: number;
  startItem: number;
  endItem: number;
  currentPage: number;
  totalPages: number;
  paginate: boolean;
  onPageChange: (page: number) => void;
}) {
  const summary = loading
    ? "Loading..."
    : totalItems === 0
      ? "No results"
      : `${startItem}-${endItem} of ${totalItems}`;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        {summary}
      </p>

      {paginate && totalItems > 0 && (
        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * COMPONENT
 * ========================================================= */

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  newRowKeys = EMPTY_ROW_KEYS,
  updatedRowKeys = EMPTY_ROW_KEYS,
  updatedFieldKeys = EMPTY_FIELD_KEYS,
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
  const [pageTransitionDirection, setPageTransitionDirection] =
    React.useState<Direction>(null);

  const page = controlledPage ?? internalPage;

  /* ---------- Page navigation ---------- */

  function goToPage(next: number) {
    setPageTransitionDirection(next > page ? "next" : "previous");

    if (onPageChange) {
      onPageChange(next);
    } else {
      setInternalPage(next);
    }

    window.setTimeout(() => {
      setPageTransitionDirection(null);
    }, PAGE_TRANSITION_MS);
  }

  // Reset to page 1 whenever the underlying dataset shrinks below the
  // current page (e.g. after a filter change) — client mode only.
  React.useEffect(() => {
    if (serverPagination) return;

    const pages = Math.max(1, Math.ceil(data.length / pageSize));

    if (page > pages) {
      goToPage(1);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, pageSize, serverPagination]);

  /* ---------- Derived pagination values ---------- */

  const totalItems = serverPagination ? (total ?? data.length) : data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const rows = serverPagination
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const isPageTransition = Boolean(pageTransitionDirection);

  /* ---------- Render ---------- */

  return (
    <div className={className ?? DEFAULT_CONTAINER_CLASS}>
      {/* BODY */}
      <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin] [&>[data-slot=table-container]]:overflow-visible">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={getColumnClassName(column)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <SkeletonRows columns={columns} count={pageSize} />
            ) : rows.length === 0 ? (
              <EmptyRow
                colSpan={columns.length}
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {rows.map((row, index) => {
                  const rowKey = getRowKey(row, index);
                  const changedFields = updatedFieldKeys.get(String(rowKey));
                  const isUpdatedRow = updatedRowKeys.has(rowKey);

                  return (
                    <MotionTableRow
                      key={`${currentPage}-${rowKey}`}
                      layout="position"
                      {...getRowMotion({
                        isNewRow: newRowKeys.has(rowKey),
                        isUpdatedRow,
                        isPageTransition,
                        direction: pageTransitionDirection,
                      })}
                      className={isUpdatedRow ? "bg-primary/10" : undefined}
                    >
                      {columns.map((column) => {
                        const isFieldUpdated = Boolean(
                          column.fieldKey && changedFields?.has(column.fieldKey),
                        );

                        return (
                          <TableCell
                            key={column.key}
                            className={getColumnClassName(column)}
                          >
                            <MotionCellContent
                              {...getCellMotion(isFieldUpdated)}
                              className={
                                isFieldUpdated
                                  ? "font-medium text-primary"
                                  : undefined
                              }
                            >
                              {column.cell(row, index)}
                            </MotionCellContent>
                          </TableCell>
                        );
                      })}
                    </MotionTableRow>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER */}
      <DataTableFooter
        loading={loading}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
        onPageChange={goToPage}
      />
    </div>
  );
}
