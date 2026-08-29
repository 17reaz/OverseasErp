// src/modules/erp/medical/components/medical-table.tsx

import { ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Medical, MedicalStatus } from "../medical-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface MedicalTableProps {
  medicals: Medical[];
  loading: boolean;

  onEdit: (medical: Medical) => void;
  onDelete: (medical: Medical) => void;
  onNext?: (medical: Medical) => void;
}

function getStatusVariant(status: MedicalStatus) {
  if (status === "unfit") return "destructive" as const;
  if (status === "fit") return "default" as const;
  if (status === "expired") return "secondary" as const;
  return "outline" as const;
}

function getStatusLabel(status: MedicalStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function MedicalTable({
  medicals,
  loading,
  onEdit,
  onDelete,
  onNext,
}: MedicalTableProps) {
  const columns: DataTableColumn<Medical>[] = [
    {
      key: "candidate",
      header: "Candidate",
      className: "font-medium",
      cell: (medical) => medical.candidate?.name ?? "—",
    },
    {
      key: "passport",
      header: "Passport",
      hideOnMobile: true,
      cell: (medical) => medical.candidate?.passport_no ?? "—",
    },
    {
      key: "medical_date",
      header: "Medical Date",
      cell: (medical) => medical.medical_date ?? "—",
    },
    {
      key: "fit_date",
      header: "Fit Date",
      hideOnMobile: true,
      cell: (medical) => medical.fit_date ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (medical) => (
        <Badge variant={getStatusVariant(medical.status)}>
          {getStatusLabel(medical.status)}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[150px] text-right",
      cell: (medical) => (
        <div className="flex items-center justify-end gap-1">
          {medical.status === "fit" && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onNext?.(medical)}
            >
              Next
              <ArrowRight />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <MoreHorizontal />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(medical)}>
                <Pencil />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(medical)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={medicals}
      getRowKey={(medical) => medical.id}
      loading={loading}
      emptyTitle="No medical records found"
      emptyDescription="Medical records will appear here."
    />
  );
}