import {
  Building2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { Agency } from "../agency-service";
import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

type AgencyViewMode = "list" | "grid";

interface AgencyTableProps {
  agencies: Agency[];
  loading?: boolean;

  viewMode?: AgencyViewMode;

  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;

  onEdit?: (agency: Agency) => void;
  onDelete?: (agency: Agency) => void;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium sm:px-2.5 sm:py-1",
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const TABLE_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background";

function AgencyActions({
  agency,
  onEdit,
  onDelete,
}: {
  agency: Agency;
  onEdit?: (agency: Agency) => void;
  onDelete?: (agency: Agency) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="More actions"
          aria-label="More agency actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-44 p-1">
        <button
          type="button"
          onClick={() => onEdit?.(agency)}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <Pencil className="h-4 w-4" />
          Edit agency
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(agency)}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete agency
        </button>
      </PopoverContent>
    </Popover>
  );
}

function AgencyGrid({
  agencies,
  onEdit,
  onDelete,
}: {
  agencies: Agency[];
  onEdit?: (agency: Agency) => void;
  onDelete?: (agency: Agency) => void;
}) {
  if (agencies.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border bg-background px-4 text-center">
        <Building2 className="mb-3 h-9 w-9 text-muted-foreground/50" />
        <p className="text-sm font-medium">No agencies found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create an agency to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {agencies.map((agency, index) => (
        <div
          key={agency.id}
          className="group min-w-0 rounded-lg border bg-background p-4 transition-colors hover:border-primary/30"
        >
          {/* Card Header */}
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <Link
                to={`/app/agencies/${agency.id}`}
                className="block truncate text-sm font-semibold hover:text-primary hover:underline"
              >
                {agency.name}
              </Link>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {agency.code || "No agency code"}
              </p>
            </div>

            <AgencyActions
              agency={agency}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          {/* Contact Details */}
          <div className="mt-4 space-y-2.5 border-t pt-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              {agency.phone ? (
                <span className="truncate">{agency.phone}</span>
              ) : (
                <span className="text-muted-foreground">No phone number</span>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              {agency.email ? (
                <span className="truncate">{agency.email}</span>
              ) : (
                <span className="text-muted-foreground">No email address</span>
              )}
            </div>

            {agency.address && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="truncate text-xs text-muted-foreground">
                    {agency.address}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-xs break-words"
                >
                  {agency.address}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Card Footer */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              SL: {agency.sl ?? index + 1}
            </span>

            <StatusBadge active={!!agency.is_active} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgencyTable({
  agencies,
  loading = false,
  viewMode = "list",
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
      hideOnMobile: true,
      cell: (agency, index) => agency.sl ?? index + 1,
    },
    {
      key: "agency",
      header: "Agency",
      cell: (agency) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/30">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <Link
              to={`/app/agencies/${agency.id}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {agency.name}
            </Link>

            {agency.address && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="block cursor-default truncate text-xs text-muted-foreground">
                    {agency.address}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-xs break-words"
                >
                  {agency.address}
                </TooltipContent>
              </Tooltip>
            )}

            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground md:hidden">
              {agency.code && (
                <p className="truncate">Code: {agency.code}</p>
              )}

              {agency.phone && (
                <p className="flex min-w-0 items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{agency.phone}</span>
                </p>
              )}

              {agency.email && (
                <p className="flex min-w-0 items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{agency.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      className: "w-[140px]",
      hideOnMobile: true,
      cell: (agency) => (
        <span className="block truncate">{agency.code || "—"}</span>
      ),
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
      className: "w-[84px] sm:w-[120px]",
      cell: (agency) => <StatusBadge active={!!agency.is_active} />,
    },
    {
      key: "action",
      header: "Action",
      className: "w-[56px] text-right sm:w-[100px]",
      cell: (agency) => (
        <div className="flex items-center justify-end">
          <AgencyActions
            agency={agency}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      {viewMode === "grid" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-lg border bg-background">
              <p className="text-sm text-muted-foreground">
                Loading agencies...
              </p>
            </div>
          ) : (
            <AgencyGrid
              agencies={agencies}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}

          {typeof total === "number" && total > pageSize && (
            <div className="flex items-center justify-between border-t py-3 text-sm">
              <span className="text-muted-foreground">
                {agencies.length} of {total} agencies
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || (page ?? 1) <= 1}
                  onClick={() => onPageChange?.((page ?? 1) - 1)}
                >
                  Previous
                </Button>

                <span className="min-w-12 text-center text-xs text-muted-foreground">
                  {page ?? 1} / {Math.max(1, Math.ceil(total / pageSize))}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    loading ||
                    (page ?? 1) >= Math.ceil(total / pageSize)
                  }
                  onClick={() => onPageChange?.((page ?? 1) + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
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
          serverPagination={
            typeof total === "number" && total !== agencies.length
          }
          className={TABLE_CLASS}
        />
      )}
    </TooltipProvider>
  );
}