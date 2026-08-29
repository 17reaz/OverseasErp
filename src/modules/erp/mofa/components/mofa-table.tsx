// src/modules/erp/mofa/components/mofa-table.tsx

import { CalendarDays, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Mofa } from "../mofa-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

/* =========================================================
 * PROPS
 * ========================================================= */

interface MofaTableProps {
  mofas: Mofa[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit?: (mofa: Mofa) => void;
  onDelete?: (mofa: Mofa) => void;
}

/* =========================================================
 * STAGE LABEL / CLASS
 * ========================================================= */

function getStageLabel(stage: Mofa["stage"]) {
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

function getStageClass(stage: Mofa["stage"]) {
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
 * TABLE
 * ========================================================= */

export function MofaTable({
  mofas,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: MofaTableProps) {
  const columns: DataTableColumn<Mofa>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[70px]",
      cell: (mofa, index) => mofa.sl ?? index + 1,
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (mofa) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {mofa.candidate?.name ?? "Unknown candidate"}
          </p>

          {mofa.candidate?.agent?.name && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Agent: {mofa.candidate.agent.name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      className: "w-[150px]",
      hideOnMobile: true,
      cell: (mofa) => (
        <span className="block truncate">
          {mofa.candidate?.passport_no ?? "—"}
        </span>
      ),
    },
    {
      key: "application",
      header: "Application",
      className: "w-[180px]",
      cell: (mofa) => (
        <p className="truncate text-sm font-medium">
          {mofa.application_number ?? "—"}
        </p>
      ),
    },
    {
      key: "date",
      header: "Date",
      className: "w-[140px]",
      hideOnMobile: true,
      cell: (mofa) =>
        mofa.application_date ? (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{formatDate(mofa.application_date)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "agency",
      header: "Agency",
      className: "w-[150px]",
      hideOnMobile: true,
      cell: (mofa) =>
        mofa.agency ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {mofa.agency.name}
            </p>

            {mofa.agency.code && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {mofa.agency.code}
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "trade",
      header: "Trade",
      className: "w-[130px]",
      hideOnMobile: true,
      cell: (mofa) => (
        <span className="block truncate text-sm">{mofa.trade ?? "—"}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      className: "w-[140px]",
      cell: (mofa) => (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getStageClass(
            mofa.stage,
          )}`}
        >
          {getStageLabel(mofa.stage)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[100px] text-right",
      cell: (mofa) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(mofa)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit MOFA</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(mofa)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete MOFA</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={mofas}
      getRowKey={(mofa) => mofa.id}
      loading={loading}
      emptyTitle="No MOFA records found"
      emptyDescription="Create a MOFA record to see it here."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== mofas.length}
    />
  );
}