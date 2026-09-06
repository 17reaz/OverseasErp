import { Check, Pencil, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import type { BmetRecord } from "../bmet-service";

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

interface BmetTableProps {
  records: BmetRecord[];
  candidates: CandidateInfo[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit: (record: BmetRecord) => void;
  onDelete: (record: BmetRecord) => void;
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isComplete(record: BmetRecord) {
  return (
    record.pdo &&
    record.finger &&
    record.nominee &&
    record.bank &&
    record.bmet
  );
}

function ChecklistBadge({
  checked,
}: {
  checked: boolean;
}) {
  return checked ? (
    <span className="inline-flex items-center justify-center">
      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center">
      <X className="h-4 w-4 text-muted-foreground" />
    </span>
  );
}

export function BmetTable({
  records,
  candidates,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: BmetTableProps) {
  const candidateMap = new Map(
    candidates.map((candidate) => [
      candidate.id,
      candidate,
    ]),
  );

  const columns: DataTableColumn<BmetRecord>[] = [
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <span className="font-medium">
          {candidateMap.get(record.candidate_id)?.name ??
            "Unknown candidate"}
        </span>
      ),
    },

    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (record) => (
        <span className="font-mono text-sm">
          {candidateMap.get(record.candidate_id)
            ?.passport_no ?? "—"}
        </span>
      ),
    },

    {
      key: "pdo",
      header: "PDO",
      className: "w-[70px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.pdo} />
        </div>
      ),
    },

    {
      key: "finger",
      header: "Finger",
      className: "w-[80px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.finger} />
        </div>
      ),
    },

    {
      key: "nominee",
      header: "Nominee",
      className: "w-[85px] text-center",
      hideOnMobile: true,
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.nominee} />
        </div>
      ),
    },

    {
      key: "bank",
      header: "Bank",
      className: "w-[70px] text-center",
      hideOnMobile: true,
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.bank} />
        </div>
      ),
    },

    {
      key: "bmet",
      header: "BMET",
      className: "w-[70px] text-center",
      cell: (record) => (
        <div className="flex justify-center">
          <ChecklistBadge checked={record.bmet} />
        </div>
      ),
    },

    {
      key: "bmet_date",
      header: "BMET Date",
      hideOnMobile: true,
      cell: (record) =>
        formatDate(record.bmet_date),
    },

    {
      key: "status",
      header: "Status",
      cell: (record) => {
        const complete = isComplete(record);

        return (
          <Badge
            variant="outline"
            className={
              complete
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }
          >
            {complete ? "Complete" : "Pending"}
          </Badge>
        );
      },
    },

    {
      key: "action",
      header: "Actions",
      className: "w-[110px] text-right",
      cell: (record) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(record)}
            aria-label="Edit BMET record"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(record)}
            aria-label="Delete BMET record"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No BMET records found"
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={
        typeof total === "number" &&
        total !== records.length
      }
    />
  );
}