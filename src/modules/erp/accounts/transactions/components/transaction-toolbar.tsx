// src/modules/erp/accounting/transactions/components/transaction-toolbar.tsx

import type { ReactNode } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TransactionToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  typeFilter: "all" | "income" | "expense";
  onTypeFilterChange: (
    value: "all" | "income" | "expense",
  ) => void;

  statusFilter:
    | "all"
    | "pending"
    | "completed"
    | "cancelled";

  onStatusFilterChange: (
    value:
      | "all"
      | "pending"
      | "completed"
      | "cancelled",
  ) => void;

  refreshing: boolean;
  onRefresh: () => void;

  onCreate: () => void;

  children?: ReactNode;
}

export function TransactionToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  refreshing,
  onRefresh,
  onCreate,
  children,
}: TransactionToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search transactions..."
            className="h-9 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={onCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          {(
            [
              ["all", "All"],
              ["income", "Income"],
              ["expense", "Expense"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={
                typeFilter === value
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
              className="h-7"
              onClick={() =>
                onTypeFilterChange(value)
              }
            >
              {label}
            </Button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target
                .value as TransactionToolbarProps["statusFilter"],
            )
          }
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">
            All status
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="completed">
            Completed
          </option>
          <option value="cancelled">
            Cancelled
          </option>
        </select>

        {children}
      </div>
    </div>
  );
}