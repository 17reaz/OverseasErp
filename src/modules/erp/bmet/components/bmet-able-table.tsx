
import { Plus, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "../../shared/ui/data-table";
import type { Visa } from "../../visa/visa-service";
import type { BmetRecord } from "../bmet-service";

interface CandidateInfo {
  id: string;
  name: string;
  passport_no: string;
}

export interface BmetAbleItem {
  visa: Visa;
  candidate: CandidateInfo;
  record: BmetRecord | null;
}

interface BmetAbleTableProps {
  items: BmetAbleItem[];
  loading?: boolean;
  onCreate: (candidateId: string, visaId: string) => void;
  onEdit: (record: BmetRecord) => void;
}

export function BmetAbleTable({
  items,
  loading = false,
  onCreate,
  onEdit,
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
      cell: () => (
        <Badge variant="outline" className="text-emerald-600">
          Issued
        </Badge>
      ),
    },
    {
      key: "bmet_status",
      header: "BMET Status",
      cell: (item) => (
        <Badge
          variant="outline"
          className={
            item.record
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
              : "border-red-500/30 bg-red-500/10 text-red-700"
          }
        >
          {item.record ? "In Progress" : "Not Started"}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[150px] text-right",
      cell: (item) => (
        <div className="flex justify-end">
          {item.record ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEdit(item.record!)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Continue
            </Button>
          ) : (
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
          )}
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
      emptyTitle="No candidates pending BMET"
      pageSize={10}
    />
  );
}
