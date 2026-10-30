
import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface TakamulAbleCandidate {
  id: string;
  name: string;
  passport_no: string;
  profession: string;
}

interface TakamulAbleTableProps {
  records?: TakamulAbleCandidate[];
  loading?: boolean;
}

const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";

export function TakamulAbleTable({
  records = [],
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
      key: "mofa",
      header: "MOFA Status",
      cell: () => "—",
    },
    {
      key: "visa",
      header: "Visa Status",
      cell: () => "—",
    },
    {
      key: "action",
      header: "Actions",
      className: "w-[100px] text-right",
      cell: () => (
        <span className="text-xs text-muted-foreground">Coming soon</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      loading={loading}
      emptyTitle="No Takamul-able candidates found"
      emptyDescription="Eligible candidates will appear here."
      pageSize={10}
      className={TABLE_CLASS}
    />
  );
}
