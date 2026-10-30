import { Plane, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";

import type { Visa } from "../../visa/visa-service";

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

export interface FlightAbleItem {
  visa: Visa;
  candidate: CandidateInfo;
}

interface FlightAbleTableProps {
  items: FlightAbleItem[];
  loading?: boolean;
  onCreate: (visaId: string) => void;
}

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

export function FlightAbleTable({
  items,
  loading = false,
  onCreate,
}: FlightAbleTableProps) {
  const columns: DataTableColumn<FlightAbleItem>[] = [
    {
      key: "candidate",
      header: "Candidate",
      cell: (item) => (
        <span className="font-medium">
          {item.candidate.name}
        </span>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (item) => (
        <span className="font-mono text-sm">
          {item.candidate.passport_no || "—"}
        </span>
      ),
    },
    {
      key: "visa_sl",
      header: "Visa SL",
      cell: (item) => (
        <span className="font-medium">
          SL-{item.visa.sl}
        </span>
      ),
    },
    {
      key: "visa_no",
      header: "Visa No",
      hideOnMobile: true,
      cell: (item) => (
        <span className="font-mono text-sm">
          {item.visa.visa_no || "—"}
        </span>
      ),
    },
    {
      key: "visa_date",
      header: "Visa Date",
      hideOnMobile: true,
      cell: (item) => formatDate(item.visa.visa_date),
    },
    {
      key: "expiry_date",
      header: "Expiry Date",
      hideOnMobile: true,
      cell: (item) => formatDate(item.visa.expiry_date),
    },
    {
      key: "bmet_status",
      header: "BMET Status",
      cell: () => (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
        >
          Complete
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[150px] text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => onCreate(item.visa.id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Flight
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowKey={(item) => item.visa.id}
      loading={loading}
      emptyTitle="No candidates ready for flight"
      emptyDescription="Candidates with completed BMET and no flight record will appear here."
      pageSize={10}
    />
  );
}