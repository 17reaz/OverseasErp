// src/modules/erp/mofa/components/mofa-table.tsx

// import { CalendarDays,MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  CalendarDays,
  MoreVertical,
  Pencil,
  RotateCw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * BADGE CONFIG
 *
 * Unknown values fall back to the raw value as label and
 * to DEFAULT_BADGE_CLASS as style.
 * ========================================================= */

const BADGE_BASE_CLASS =
  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium";

const DEFAULT_BADGE_CLASS = "border-border bg-background";

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  medupdated: "Medical Updated",
  approved: "Approved",
  canceled: "Canceled",
  expired: "Expired",
  invalid: "Invalid",
};

const STAGE_CLASSES: Record<string, string> = {
  approved: "border-foreground/20 bg-foreground/5",
  medupdated: "border-border bg-muted",
  canceled: "border-destructive/20 bg-destructive/5 text-destructive",
  expired: "border-border bg-muted text-muted-foreground",
  invalid: "border-destructive/20 bg-destructive/5 text-destructive",
  new: DEFAULT_BADGE_CLASS,
};

const VALIDITY_LABELS: Record<string, string> = {
  active: "Active",
  used: "Used",
  expired: "Expired",
  invalid: "Invalid",
};

const VALIDITY_CLASSES: Record<string, string> = {
  active: "border-foreground/20 bg-foreground/5 text-foreground",
  used: "border-border bg-muted text-muted-foreground",
  expired: "border-border bg-muted text-muted-foreground",
  invalid: "border-destructive/20 bg-destructive/5 text-destructive",
};

function getStageLabel(stage: Mofa["stage"]) {
  return STAGE_LABELS[stage] ?? stage;
}

function getStageClass(stage: Mofa["stage"]) {
  return STAGE_CLASSES[stage] ?? DEFAULT_BADGE_CLASS;
}

function getValidityLabel(status: Mofa["validity_status"]) {
  return VALIDITY_LABELS[status] ?? status;
}

function getValidityClass(status: Mofa["validity_status"]) {
  return VALIDITY_CLASSES[status] ?? DEFAULT_BADGE_CLASS;
}

/* =========================================================
 * HELPERS
 * ========================================================= */

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
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-sm font-medium">
          {mofa.candidate?.name ?? "Unknown candidate"}
        </p>
        {mofa.version > 1 && (
          <span
            title={`MOFA version ${mofa.version}`}
            className="inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] font-semibold leading-none text-amber-600 dark:text-amber-400"
          >
            <RotateCw className="size-2.5" />
            V{mofa.version}
          </span>
        )}
      </div>

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
            <p className="truncate text-sm font-medium">{mofa.agency.name}</p>

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
        <span className={`${BADGE_BASE_CLASS} ${getStageClass(mofa.stage)}`}>
          {getStageLabel(mofa.stage)}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      className: "w-[120px]",
      cell: (mofa) => (
        <span
          className={`${BADGE_BASE_CLASS} ${getValidityClass(
            mofa.validity_status,
          )}`}
        >
          {getValidityLabel(mofa.validity_status)}
        </span>
      ),
    },
    {
  key: "action",
  header: "Action",
  className: "w-[100px] text-right",
  cell: (mofa) => (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">
              Open actions
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-36"
        >
          <DropdownMenuItem
            onClick={() => onEdit?.(mofa)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onDelete?.(mofa)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
