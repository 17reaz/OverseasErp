// src/modules/erp/agency/components/agency-table.tsx

import { Building2, Mail, Pencil, Phone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Agency } from "../agency-service";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

interface AgencyTableProps {
  agencies: Agency[];
  loading?: boolean;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit?: (agency: Agency) => void;
  onDelete?: (agency: Agency) => void;
}

export function AgencyTable({
  agencies,
  loading = false,

  page,
  pageSize = 10,
  total,
  onPageChange,

  onEdit,
  onDelete,
}: AgencyTableProps) {
  const columns: DataTableColumn<Agency>[] = [
    {
      key: "sl",
      header: "SL",
      className: "w-[70px]",
      cell: (agency, index) => agency.sl ?? index + 1,
    },
    {
      key: "agency",
      header: "Agency",
      cell: (agency) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/30">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{agency.name}</p>

            {agency.address && (
              <p className="truncate text-xs text-muted-foreground">
                {agency.address}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      className: "w-[140px]",
      hideOnMobile: true,
      cell: (agency) => <span className="block truncate">{agency.code}</span>,
    },
    {
      key: "phone",
      header: "Contact",
      className: "w-[170px]",
      hideOnMobile: true,
      cell: (agency) =>
        agency.phone ? (
          <div className="flex min-w-0 items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{agency.phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "email",
      header: "Email",
      className: "w-[220px]",
      hideOnMobile: true,
      cell: (agency) =>
        agency.email ? (
          <div className="flex min-w-0 items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{agency.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      cell: (agency) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
            agency.is_active
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {agency.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "w-[130px] text-right",
      cell: (agency) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(agency)}
            title="Edit agency"
          >
            <Pencil />
            <span className="sr-only">Edit agency</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(agency)}
            title="Delete agency"
          >
            <Trash2 />
            <span className="sr-only">Delete agency</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={agencies}
      getRowKey={(agency) => agency.id}
      loading={loading}
      emptyTitle="No agencies found"
      emptyDescription="Create an agency to get started."
      pageSize={pageSize}
      page={page}
      onPageChange={onPageChange}
      total={total}
      serverPagination={typeof total === "number" && total !== agencies.length}
    />
  );
}