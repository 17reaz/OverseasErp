
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import type { PoliceClearanceAbleCandidate } from "../police-clearance-page";

interface Props {
  candidates: PoliceClearanceAbleCandidate[];
  loading?: boolean;
  onCreate: (candidateId: string) => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value + "T00:00:00");

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PoliceClearanceAbleTable({
  candidates,
  loading = false,
  onCreate,
}: Props) {
  const columns: DataTableColumn<PoliceClearanceAbleCandidate>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[72px] font-medium",
      cell: (row) => row.sl ?? "—",
    },
    {
      key: "candidate",
      header: "Candidate",
      cell: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.passport_no || "—"}
        </span>
      ),
    },
    {
      key: "medical",
      header: "Medical Fit Date",
      className: "whitespace-nowrap",
      cell: (row) => formatDate(row.fit_date),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[120px] text-right",
      cell: (row) => (
        <Button
          size="sm"
          onClick={() => onCreate(row.candidate_id)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create PC
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={candidates}
      getRowKey={(row) => row.candidate_id}
      loading={loading}
      emptyTitle="No PC-eligible candidates"
      emptyDescription="Candidates with an active fit medical and no issued visa or existing PC record will appear here."
      pageSize={10}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background"
    />
  );
}
