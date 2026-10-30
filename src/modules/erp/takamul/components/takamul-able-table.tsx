
import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

export interface TakamulAbleCandidate {
  id: string;
  candidate_id: string;
  name: string;
  passport_no: string;
  mofa_id: string;
  application_number: string | null;
  application_date: string;
  profession: string;
  mofa_status: string;
}

interface TakamulAbleTableProps {
  records: TakamulAbleCandidate[];
  loading?: boolean;
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

export function TakamulAbleTable({
  records,
  loading = false,
}: TakamulAbleTableProps) {
  const columns: DataTableColumn<TakamulAbleCandidate>[] = [
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
        <span className="font-mono text-xs">{record.passport_no}</span>
      ),
    },
    {
      key: "profession",
      header: "Profession",
      cell: (record) => record.profession || "—",
    },
    {
      key: "application_number",
      header: "MOFA Number",
      cell: (record) => record.application_number || "—",
    },
    {
      key: "application_date",
      header: "MOFA Date",
      cell: (record) => formatDate(record.application_date),
    },
    {
      key: "mofa_status",
      header: "MOFA Status",
      cell: (record) => (
        <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
          {record.mofa_status}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.mofa_id}
      loading={loading}
      emptyTitle="No Takamul-able candidates found"
      emptyDescription="Candidates with active MOFA and without Visa will appear here."
      pageSize={10}
      className={TABLE_CLASS}
    />
  );
}
