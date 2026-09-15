// src/modules/erp/accounting/transactions/components/transaction-table.tsx

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
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

import type { Transaction } from "../transaction-types";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;

  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(`${value}T00:00:00`));
}

function formatCurrency(
  amount: number,
  currency = "BDT",
) {
  return new Intl.NumberFormat(
    "en-BD",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function statusClass(
  status: Transaction["status"],
) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";

    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TransactionTable({
  transactions,
  loading,
  onView,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const columns: DataTableColumn<Transaction>[] =
    [
      {
        key: "date",
        header: "Date",
        className:
          "whitespace-nowrap",
        cell: (row) =>
          formatDate(row.date),
      },

      {
        key: "description",
        header: "Description",
        cell: (row) => (
          <div className="max-w-[260px]">
            <button
              type="button"
              className="truncate text-left font-medium hover:underline"
              onClick={() =>
                onView(row)
              }
            >
              {row.description ||
                "Untitled transaction"}
            </button>

            {row.reference && (
              <p className="truncate text-xs text-muted-foreground">
                Ref: {row.reference}
              </p>
            )}
          </div>
        ),
      },

      {
        key: "category",
        header: "Category",
        hideOnMobile: true,
        cell: (row) =>
          row.category?.name ?? "-",
      },

      {
        key: "account",
        header: "Account",
        hideOnMobile: true,
        cell: (row) =>
          row.account?.name ?? "-",
      },

      {
        key: "party",
        header: "Related",
        hideOnMobile: true,
        cell: (row) => {
          if (!row.party) {
            return (
              <span className="text-muted-foreground">
                —
              </span>
            );
          }

          return (
            <div className="max-w-[160px]">
              <p className="truncate">
                {row.party.name}
              </p>

              <p className="text-xs capitalize text-muted-foreground">
                {row.party.partyType}
              </p>
            </div>
          );
        },
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
        cell: (row) => {
          const currency =
            row.account?.currency ??
            "BDT";

          return (
            <span
              className={
                row.type === "income"
                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                  : "font-semibold text-destructive"
              }
            >
              {row.type === "income"
                ? "+"
                : "-"}
              {formatCurrency(
                row.amount,
                currency,
              )}
            </span>
          );
        },
      },

      {
        key: "actions",
        header: "",
        className:
          "w-[60px] text-right",
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
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
      data={transactions}
      getRowKey={(row) => row.id}
      loading={loading}
      emptyTitle="No transactions found"
      emptyDescription="Add your first accounting transaction to get started."
      pageSize={10}
    />
  );
}