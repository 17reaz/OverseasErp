
import { Plus } from "lucide-react";

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

export interface BmetAbleItem {
  visa: Visa;
  candidate: CandidateInfo;
}

interface BmetAbleTableProps {
  items: BmetAbleItem[];
  loading?: boolean;
  onCreate: (candidateId: string, visaId: string) => void;
}

export function BmetAbleTable({
  items,
  loading = false,
  onCreate,
}: BmetAbleTableProps) {
  const columns: DataTableColumn<BmetAbleItem>[] = [
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
      cell: (item) => item.visa.visa_date || "—",
    },
    {
      key: "expiry_date",
      header: "Expiry Date",
      hideOnMobile: true,
      cell: (item) => item.visa.expiry_date || "—",
    },
    {
      key: "visa_status",
      header: "Visa Status",
      cell: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.visa.status || "Unknown"}
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
            onClick={() =>
              onCreate(item.candidate.id, item.visa.id)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create BMET
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
      emptyTitle="No BMET-able visas found"
      pageSize={10}
    />
  );
}
