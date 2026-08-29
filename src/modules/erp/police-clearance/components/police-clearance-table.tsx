// src/modules/erp/police-clearance/components/police-clearance-table.tsx

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { PoliceClearance } from "../police-clearance-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface PoliceClearanceTableProps {
  records: PoliceClearance[];
  candidates: CandidateOption[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: PoliceClearance) => void;
  onDelete: (record: PoliceClearance) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PoliceClearanceTable({
  records,
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: PoliceClearanceTableProps) {
  function getCandidate(candidateId: string) {
    return candidates.find((candidate) => candidate.id === candidateId);
  }

  const columns: DataTableColumn<PoliceClearance>[] = [
    {
      key: "sl",
      header: "SL",
      className: "font-medium",
      cell: (record) => record.sl,
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <div className="max-w-[220px] truncate font-medium">
          {getCandidate(record.candidate_id)?.name ?? "Unknown"}
        </div>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-xs">
          {getCandidate(record.candidate_id)?.passport_no ?? "—"}
        </span>
      ),
    },
    {
      key: "received",
      header: "Received",
      className: "whitespace-nowrap",
      cell: (record) => formatDate(record.received_date),
    },
    {
      key: "verification",
      header: "Verification",
      cell: (record) =>
        record.verified ? (
          <span className="inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
            Verified
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Pending
          </span>
        ),
    },
    {
      key: "verified_date",
      header: "Verified Date",
      className: "whitespace-nowrap",
      hideOnMobile: true,
      cell: (record) => formatDate(record.verified_date),
    },
    {
      key: "remarks",
      header: "Remarks",
      className: "max-w-[280px]",
      hideOnMobile: true,
      cell: (record) => (
        <span
          className="block truncate text-muted-foreground"
          title={record.remarks ?? ""}
        >
          {record.remarks || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[70px] text-right",
      cell: (record) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for PCC ${record.sl}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(record)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No police clearance records found"
      emptyDescription="Create a PCC record to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== records.length}
    />
  );
}