import { Plus, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import type { FingerRecord } from "../finger-service";
import type { FingerAbleCandidate } from "../finger-page";

interface FingerAbleTableProps {
  records: FingerAbleCandidate[];
  loading?: boolean;
  onCreate: (candidateId: string) => void;
  onEdit: (record: FingerRecord) => void;
}

const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusBadge(record: FingerRecord | null) {
  if (!record) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not Started
      </Badge>
    );
  }

  const classes: Record<string, string> = {
    pending:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    scheduled:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    failed:
      "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    cancelled:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={classes[record.status] ?? ""}
    >
      {record.status.charAt(0).toUpperCase() +
        record.status.slice(1)}
    </Badge>
  );
}

export function FingerAbleTable({
  records,
  loading = false,
  onCreate,
  onEdit,
}: FingerAbleTableProps) {
  const columns: DataTableColumn<FingerAbleCandidate>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[70px]",
      cell: (record) => record.candidate_sl ?? "—",
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (record) => (
        <span className="font-medium">{record.name}</span>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      cell: (record) => (
        <span className="font-mono text-xs">
          {record.passport_no}
        </span>
      ),
    },
    {
      key: "mofa_number",
      header: "MOFA Number",
      cell: (record) => record.application_number || "—",
    },
    {
      key: "mofa_date",
      header: "MOFA Date",
      cell: (record) => formatDate(record.application_date),
    },
    {
      key: "profession",
      header: "Profession",
      cell: (record) => record.trade || "—",
    },
    {
      key: "finger_status",
      header: "Finger Status",
      cell: (record) => getStatusBadge(record.finger_record),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[110px] text-right",
      cell: (record) =>
        record.finger_record ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(record.finger_record!)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => onCreate(record.candidate_id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.mofa_id}
      loading={loading}
      emptyTitle="No Finger-able candidates found"
      emptyDescription="Candidates with active MOFA, no Visa and incomplete Finger will appear here."
      pageSize={10}
      className={TABLE_CLASS}
    />
  );
}