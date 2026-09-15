// src/modules/erp/accounts/fixed-costs/components/fixed-costs-table.tsx

import {
  CheckCircle2,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  DataTable,
  type DataTableColumn,
} from "@/modules/erp/shared/ui/data-table";

import type { FixedCost } from "../fixed-costs-types";

import {
  dueStateClass,
  formatDate,
  formatFrequency,
  formatMoney,
  getDueState,
  getDueStateLabel,
  statusClass,
} from "../fixed-costs-utils";

interface FixedCostsTableProps {
  fixedCosts: FixedCost[];
  loading: boolean;

  onView: (cost: FixedCost) => void;
  onEdit: (cost: FixedCost) => void;
  onDelete: (cost: FixedCost) => void;
  onMarkPaid: (cost: FixedCost) => void;
  onCancel: (cost: FixedCost) => void;
  onDuplicate: (cost: FixedCost) => void;
}

export function FixedCostsTable({
  fixedCosts,
  loading,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
  onCancel,
  onDuplicate,
}: FixedCostsTableProps) {
  const columns: DataTableColumn<FixedCost>[] =
    [
      {
        key: "name",
        header: "Cost",
        cell: (row) => (
          <div className="max-w-[240px]">
            <button
              type="button"
              className="truncate text-left font-medium hover:underline"
              onClick={() => onView(row)}
            >
              {row.name}
            </button>

            <p className="truncate text-xs text-muted-foreground">
              {row.category}
              {row.vendor
                ? ` • ${row.vendor}`
                : ""}
            </p>
          </div>
        ),
      },

      {
        key: "frequency",
        header: "Frequency",
        hideOnMobile: true,
        cell: (row) =>
          formatFrequency(row.frequency),
      },

      {
        key: "dueDate",
        header: "Due Date",
        className: "whitespace-nowrap",
        cell: (row) => {
          const dueState =
            getDueState(row);

          return (
            <div>
              <p>
                {formatDate(row.dueDate)}
              </p>

              {(dueState === "overdue" ||
                dueState ===
                  "due_soon") && (
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${dueStateClass(
                    dueState,
                  )}`}
                >
                  {getDueStateLabel(
                    dueState,
                  )}
                </span>
              )}
            </div>
          );
        },
      },

      {
        key: "account",
        header: "Account",
        hideOnMobile: true,
        cell: (row) =>
          row.account?.name ?? "—",
      },

      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(
              row.status,
            )}`}
          >
            {row.status}
          </span>
        ),
      },

      {
        key: "amount",
        header: "Amount",
        className:
          "whitespace-nowrap text-right",
        cell: (row) => (
          <span className="font-semibold">
            {formatMoney(
              row.amount,
              row.account?.currency ??
                "BDT",
            )}
          </span>
        ),
      },

      {
        key: "actions",
        header: "",
        className: "w-[60px] text-right",
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onView(row)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  onEdit(row)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {row.status !== "paid" && (
                <DropdownMenuItem
                  onClick={() =>
                    onMarkPaid(row)
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as paid
                </DropdownMenuItem>
              )}

              {row.status !==
                "cancelled" && (
                <DropdownMenuItem
                  onClick={() =>
                    onCancel(row)
                  }
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() =>
                  onDuplicate(row)
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate next cycle
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  onDelete(row)
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];

  return (
    <DataTable
      columns={columns}
      data={fixedCosts}
      getRowKey={(row) => row.id}
      loading={loading}
      emptyTitle="No fixed costs found"
      emptyDescription="Add your recurring office rent, utilities, licences and other fixed expenses here."
      pageSize={10}
    />
  );
}
