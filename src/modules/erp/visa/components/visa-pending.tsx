// src/modules/erp/visa/components/visa-pending.tsx

import { Check, Circle, FileCheck2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/modules/erp/shared/ui/data-table";

import type { VisaEligibleMofa } from "../visa-service";

interface VisaPendingProps {
  items: VisaEligibleMofa[];
  loading?: boolean;
  onAddVisa?: (item: VisaEligibleMofa) => void;
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function StatusBadge({ value }: { value: boolean }) {
  const Icon = value ? Check : Circle;

  return (
    <Badge
      variant="outline"
      className={
        value
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }
    >
      <Icon className={value ? "mr-1 h-3.5 w-3.5" : "mr-1 h-3 w-3"} />
      {value ? "Complete" : "Pending"}
    </Badge>
  );
}

// =====================================================
// COMPONENT
// =====================================================

export function VisaPending({
  items,
  loading = false,
  onAddVisa,
}: VisaPendingProps) {
  const columns: DataTableColumn<VisaEligibleMofa>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[60px]",
      cell: (item, index) => item.candidate.sl ?? index + 1,
    },
    {
      key: "candidate",
      header: "Candidate",
      className: "w-[190px]",
      cell: (item) => (
        <span className="block truncate font-medium">
          {item.candidate.name}
        </span>
      ),
    },
    {
      key: "passport",
      header: "Passport",
      className: "w-[140px] font-mono",
      cell: (item) => (
        <span className="block truncate">
          {item.candidate.passport_no || "—"}
        </span>
      ),
    },
    {
      key: "medical",
      header: "Medical Fit",
      className: "w-[125px]",
      cell: (item) => formatDate(item.fit_date),
    },
    {
      key: "mofa",
      header: "MOFA",
      className: "w-[140px]",
      cell: (item) => (
        <span className="block truncate">
          {item.application_number || "—"}
        </span>
      ),
    },
    {
      key: "pc",
      header: "PC",
      className: "w-[115px]",
      cell: (item) => <StatusBadge value={item.police_clearance_verified} />,
    },
    {
      key: "finger",
      header: "Finger",
      className: "w-[115px]",
      cell: (item) => <StatusBadge value={item.finger_completed} />,
    },
    {
      key: "takamul",
      header: "Takamul",
      className: "w-[115px]",
      cell: (item) => <StatusBadge value={item.takamul_completed} />,
    },
    {
      key: "action",
      header: <span className="block text-right">Action</span>,
      className: "w-[110px] text-right",
      cell: (item) => (
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => onAddVisa?.(item)}
        >
          <FileCheck2 className="mr-2 h-4 w-4" />
          Visa
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowKey={(item) => item.id}
      loading={loading}
      emptyTitle="No candidates waiting for visa"
      emptyDescription="Candidates with valid medical and no visa will appear here."
    />
  );
}