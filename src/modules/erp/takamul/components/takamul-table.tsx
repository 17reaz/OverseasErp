// src/modules/erp/takamul/components/takamul-table.tsx

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { TradeTest } from "../takamul-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface TradeTestTableProps {
  records: TradeTest[];
  candidates: CandidateOption[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: TradeTest) => void;
  onDelete: (record: TradeTest) => void;
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

export function TradeTestTable({
  records,
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: TradeTestTableProps) {
  function getCandidate(candidateId: string) {
    return candidates.find((c) => c.id === candidateId);
  }

  const columns: DataTableColumn<TradeTest>[] = [
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
        <div className="max-w-[180px] truncate font-medium">
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
      key: "test_center",
      header: "Test Center",
      cell: (record) => record.test_center,
    },
    {
      key: "test_date",
      header: "Test Date",
      className: "whitespace-nowrap",
      cell: (record) => formatDate(record.test_date),
    },
    {
      key: "result",
      header: "Result",
      className: "capitalize",
      cell: (record) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            record.result === "pass"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : record.result === "fail"
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          {record.result}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "capitalize",
      hideOnMobile: true,
      cell: (record) => (
        <span className="text-muted-foreground">{record.status}</span>
      ),
    },
    {
      key: "certificate",
      header: "Certificate",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-xs">
          {record.certificate_no ?? "—"}
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
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(record)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      emptyTitle="No trade test records found"
      emptyDescription="Create a trade test record to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== records.length}
    />
  );
}