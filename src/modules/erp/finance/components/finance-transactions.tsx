// src/modules/erp/finance/components/finance-transactions.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTable, type DataTableColumn } from "../../shared/ui/data-table";

import { FinanceToolbar } from "./finance-toolbar";
import { FinanceTransactionSheet } from "./finance-transaction-sheet";

import {
  deleteTransaction,
  getAccounts,
  getTransactions,
} from "../finance-service";

import {
  formatCurrency,
  formatDate,
  transactionStatusClass,
} from "../finance-utils";

import type { FinanceAccount, FinanceTransaction } from "../finance-types";

export function FinanceTransactions() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [transactionList, accountList] = await Promise.all([
        getTransactions(),
        getAccounts(),
      ]);

      setTransactions(transactionList);
      setAccounts(accountList);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function getAccountName(accountId: string) {
    return accounts.find((a) => a.id === accountId)?.name ?? "Unknown";
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      if (!query) return true;

      return (
        transaction.description.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query) ||
        transaction.reference?.toLowerCase().includes(query) ||
        getAccountName(transaction.accountId).toLowerCase().includes(query)
      );
    });
  }, [transactions, search, typeFilter, accounts]);

  function handleCreate() {
    setEditingTransaction(null);
    setSheetOpen(true);
  }

  function handleEdit(transaction: FinanceTransaction) {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  }

  async function handleDelete(transaction: FinanceTransaction) {
    const confirmed = window.confirm(
      `Delete transaction "${transaction.description}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteTransaction(transaction.id);
      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }

  function handleSuccess(saved: FinanceTransaction) {
    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      if (exists) return prev.map((t) => (t.id === saved.id ? saved : t));
      return [saved, ...prev];
    });
  }

  const columns: DataTableColumn<FinanceTransaction>[] = [
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap",
      cell: (row) => formatDate(row.date),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <div className="max-w-[220px]">
          <p className="truncate font-medium">{row.description}</p>
          {row.reference && (
            <p className="truncate text-xs text-muted-foreground">
              {row.reference}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (row) => row.category,
    },
    {
      key: "account",
      header: "Account",
      hideOnMobile: true,
      cell: (row) => getAccountName(row.accountId),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${transactionStatusClass(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <span
          className={
            row.type === "income"
              ? "font-semibold text-emerald-600 dark:text-emerald-400"
              : "font-semibold text-destructive"
          }
        >
          {row.type === "income" ? "+" : "-"}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      className: "w-[60px] text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FinanceToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search description, category, account..."
        onRefresh={() => {
          setRefreshing(true);
          void loadData();
        }}
        refreshing={refreshing}
        onCreate={handleCreate}
        createLabel="Add Transaction"
      >
        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as "all" | "income" | "expense")
          }
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </FinanceToolbar>

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No transactions found"
        emptyDescription="Add a transaction to get started."
        pageSize={10}
      />

      <FinanceTransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
