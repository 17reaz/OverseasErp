// src/modules/erp/visa/components/visa-table.tsx

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Visa } from "../visa-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface AgencyOption {
  id: string;
  name: string;
}

interface VisaTableProps {
  records: Visa[];
  candidates: CandidateOption[];
  agencies: AgencyOption[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: Visa) => void;
  onDelete: (record: Visa) => void;
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

export function VisaTable({
  records,
  candidates,
  agencies,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: VisaTableProps) {
  function getCandidate(id: string) {
    return candidates.find((c) => c.id === id);
  }

  function getAgency(id: string | null) {
    if (!id) return null;
    return agencies.find((a) => a.id === id);
  }

  const columns: DataTableColumn<Visa>[] = [
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
        <div className="max-w-[160px] truncate font-medium">
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
      key: "visa_no",
      header: "Visa No",
      cell: (record) => (
        <span className="font-mono text-xs font-semibold">
          {record.visa_no}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      className: "capitalize",
      hideOnMobile: true,
      cell: (record) => record.visa_type,
    },
    {
      key: "visa_date",
      header: "Visa Date",
      className: "whitespace-nowrap",
      cell: (record) => formatDate(record.visa_date),
    },
    {
      key: "expiry_date",
      header: "Expiry Date",
      className: "whitespace-nowrap",
      hideOnMobile: true,
      cell: (record) => formatDate(record.expiry_date),
    },
    {
      key: "agency",
      header: "Agency",
      hideOnMobile: true,
      cell: (record) => getAgency(record.agency_id)?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      className: "capitalize",
      cell: (record) => (
        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {record.status}
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
      emptyTitle="No visa records found"
      emptyDescription="Create a visa record to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== records.length}
    />
  );
}