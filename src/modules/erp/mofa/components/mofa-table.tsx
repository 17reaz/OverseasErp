// src/modules/erp/mofa/components/mofa-table.tsx

import { useRef, useState } from "react";
import {
  CalendarDays,
  MoreVertical,
  Pencil,
  RotateCw,
  Trash2,
  Upload,
  Eye,
  Download,
  Loader2,
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
  mofaCopyCandidateIds: Set<string>;
  onReactivate?: (mofa: Mofa) => Promise<void>;
  onPageChange?: (page: number) => void;
  onUploadCopy?: (mofa: Mofa, file: File) => Promise<void>;
  onOpenCopy?: (mofa: Mofa) => Promise<void>;
  onDownloadCopy?: (mofa: Mofa) => Promise<void>;
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
const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";
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
 * ROW ACTIONS
 * ========================================================= */

function MofaRowActions({
  mofa,
  hasStoredCopy,
  onEdit,
  onDelete,
  onReactivate,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
}: {
  mofa: Mofa;
  hasStoredCopy: boolean;
  onEdit?: (mofa: Mofa) => void;
  onDelete?: (mofa: Mofa) => void;
  onReactivate?: (mofa: Mofa) => Promise<void>;
  onUploadCopy?: (mofa: Mofa, file: File) => Promise<void>;
  onOpenCopy?: (mofa: Mofa) => Promise<void>;
  onDownloadCopy?: (mofa: Mofa) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: () => Promise<void>) {
    try {
      setBusy(true);
      await action();
    } catch (error) {
      console.error("MOFA document action failed:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "MOFA document action failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onUploadCopy) return;

    await runAction(() => onUploadCopy(mofa, file));
  }

  return (
    <div className="flex justify-end">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            <span className="sr-only">Open MOFA actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
         {hasStoredCopy ? (
  <>
    <DropdownMenuItem
      disabled={busy || !onOpenCopy}
      onSelect={() => {
        if (onOpenCopy) {
          void runAction(() => onOpenCopy(mofa));
        }
      }}
    >
      <Eye className="mr-2 h-4 w-4" />
      View MOFA Copy
    </DropdownMenuItem>

    <DropdownMenuItem
      disabled={busy || !onDownloadCopy}
      onSelect={() => {
        if (onDownloadCopy) {
          void runAction(() => onDownloadCopy(mofa));
        }
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Download MOFA Copy
    </DropdownMenuItem>

    <DropdownMenuItem
      disabled={busy || !onUploadCopy}
      onSelect={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
    >
      <Upload className="mr-2 h-4 w-4" />
      Replace MOFA Copy
    </DropdownMenuItem>
  </>
) : (
  <DropdownMenuItem
    disabled={busy || !onUploadCopy}
    onSelect={(event) => {
      event.preventDefault();
      fileInputRef.current?.click();
    }}
  >
    <Upload className="mr-2 h-4 w-4" />
    Upload MOFA Copy
  </DropdownMenuItem>
)}
            {mofa.validity_status === "invalid" && (
  <DropdownMenuItem
    disabled={busy || !onReactivate}
    onSelect={() => {
      if (onReactivate) {
        void runAction(() => onReactivate(mofa));
      }
    }}
  >
    <RotateCw className="mr-2 h-4 w-4" />
    Reactivate MOFA
  </DropdownMenuItem>
)}
          <DropdownMenuItem disabled={busy} onSelect={() => onEdit?.(mofa)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={busy}
            onSelect={() => onDelete?.(mofa)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
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
  mofaCopyCandidateIds,
  onPageChange,
  onUploadCopy,
  onOpenCopy,
  onDownloadCopy,
  onEdit,
  onDelete,
  onReactivate,
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
      key: "agency",
      header: "Agency",
      className: "w-[150px]",
      hideOnMobile: true,
      cell: (mofa) =>
        mofa.agency ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{mofa.agency.name}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "trade_date",
      header: "Trade / Date",
      className: "w-[170px]",
      hideOnMobile: true,
      cell: (mofa) => (
        <div className="min-w-0 max-w-[160px]">
          <p
            className="truncate text-sm font-medium"
            title={mofa.trade ?? undefined}
          >
            {mofa.trade ?? "—"}
          </p>

          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatDate(mofa.application_date)}
            </span>
          </div>
        </div>
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
      className: "w-[120px] text-right",
      cell: (mofa) => (
        <MofaRowActions
          mofa={mofa}
          onEdit={onEdit}
          onDelete={onDelete}
          onUploadCopy={onUploadCopy}
          onOpenCopy={onOpenCopy}
          hasStoredCopy={mofaCopyCandidateIds.has(mofa.candidate_id)}
          onDownloadCopy={onDownloadCopy}
          onReactivate={onReactivate}
        />
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
      className={TABLE_CLASS}
    />
  );
}