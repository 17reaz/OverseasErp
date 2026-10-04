// src/modules/erp/flight/components/flight-table.tsx

import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Flight } from "../flight-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface CandidateOption {
  id: string;
  name: string;
  passport_no: string;
}

interface FlightTableProps {
  records: Flight[];
  candidates: CandidateOption[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: Flight) => void;
  onDelete: (record: Flight) => void;

  /**
   * Called when user wants to mark Iqama as completed.
   */
  onMarkIqamaComplete?: (record: Flight) => void;
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

function getIqamaStatus(record: Flight) {
  if (!record.needs_iqama) {
    return {
      label: "Not Required",
      className:
        "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium",
    };
  }

  if (record.iqama_status === "completed") {
    return {
      label: "Completed",
      className:
        "inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
  }

  if (record.iqama_status === "cancelled") {
    return {
      label: "Cancelled",
      className:
        "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  }

  return {
    label: "Pending",
    className:
      "inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
}

export function FlightTable({
  records,
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
  onMarkIqamaComplete,
}: FlightTableProps) {
  function getCandidate(id: string) {
    return candidates.find((c) => c.id === id);
  }

  function canMarkIqamaComplete(record: Flight) {
    return (
      record.status === "departed" &&
      record.needs_iqama === true &&
      record.iqama_status !== "completed" &&
      record.iqama_status !== "cancelled"
    );
  }

  const columns: DataTableColumn<Flight>[] = [
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
      key: "flight_no",
      header: "Flight No",
      cell: (record) => (
        <span className="font-mono text-xs font-semibold">
          {record.flight_no ?? "—"}
        </span>
      ),
    },

    {
      key: "airline",
      header: "Airline",
      hideOnMobile: true,
      cell: (record) => record.airline ?? "—",
    },

    {
      key: "route",
      header: "Route",
      cell: (record) =>
        record.departure_city && record.arrival_city
          ? `${record.departure_city} → ${record.arrival_city}`
          : record.departure_city || record.arrival_city || "—",
    },

    {
      key: "flight_date",
      header: "Flight Date",
      className: "whitespace-nowrap",
      cell: (record) => formatDate(record.flight_date),
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
      key: "iqama",
      header: "Iqama",
      cell: (record) => {
        const status = getIqamaStatus(record);

        return (
          <span className={status.className}>
            {status.label}
          </span>
        );
      },
    },

    {
      key: "action",
      header: "Actions",
      className: "w-[70px] text-right",
      cell: (record) => {
        const showIqamaAction =
          canMarkIqamaComplete(record) &&
          typeof onMarkIqamaComplete === "function";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              {showIqamaAction && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onMarkIqamaComplete(record)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Iqama Complete
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(record)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No flight records found"
      emptyDescription="Create a flight schedule to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={
        typeof total === "number" && total !== records.length
      }
    />
  );
}