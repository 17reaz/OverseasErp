// src/modules/erp/finger/components/finger-table.tsx

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FingerRecord, FingerStatus } from "../finger-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

// =====================================================
// TYPES
// =====================================================

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

interface FingerTableProps {
  records: FingerRecord[];
  candidates: CandidateInfo[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: FingerRecord) => void;
  onDelete: (record: FingerRecord) => void;
}

// =====================================================
// CONSTANTS
// =====================================================

const SUCCESS_CLASS =
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const MUTED_CLASS =
  "border-muted-foreground/30 bg-muted text-muted-foreground";

const STATUS_CLASS: Record<FingerStatus, string> = {
  completed: SUCCESS_CLASS,
  scheduled:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  cancelled: MUTED_CLASS,
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

// =====================================================
// HELPERS
// =====================================================

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusLabel(status: FingerStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClassName(status: FingerStatus) {
  return STATUS_CLASS[status] ?? STATUS_CLASS.pending;
}

// =====================================================
// ROW ACTIONS
// =====================================================

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// =====================================================
// COMPONENT
// =====================================================

export function FingerTable({
  records,
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: FingerTableProps) {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );

  const columns: DataTableColumn<FingerRecord>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[80px] font-medium",
      cell: (record) => record.sl,
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {candidateMap.get(record.candidate_id)?.name ??
              "Unknown candidate"}
          </span>

          <Badge
            variant="outline"
            className={record.is_current ? SUCCESS_CLASS : MUTED_CLASS}
          >
            V{record.version}
          </Badge>
        </div>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-sm">
          {candidateMap.get(record.candidate_id)?.passport_no ?? "—"}
        </span>
      ),
    },
    {
      key: "finger_date",
      header: "Finger Date",
      cell: (record) => formatDate(record.finger_date),
    },
    {
      key: "type",
      header: "Type",
      hideOnMobile: true,
      cell: (record) => (
        <Badge variant="outline">
          {record.finger_type === "fresh" ? "Fresh" : "Existing"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (record) => (
        <Badge variant="outline" className={getStatusClassName(record.status)}>
          {getStatusLabel(record.status)}
        </Badge>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      className: "max-w-[240px]",
      hideOnMobile: true,
      cell: (record) => (
        <span className="block truncate" title={record.remarks ?? undefined}>
          {record.remarks || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[90px] text-right",
      cell: (record) => (
        <RowActions
          onEdit={() => onEdit(record)}
          onDelete={() => onDelete(record)}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No finger records found"
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== records.length}
    />
  );
}